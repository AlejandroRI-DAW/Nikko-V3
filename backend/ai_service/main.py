"""
main.py - API FastAPI del backend Nikko.

Este es el UNICO punto de entrada para el equipo de frontend.

Flujo del endpoint /chat:
  1. Frontend envia {"prompt": "..."}
  2. validar_input()      -> rechaza si es fuera de alcance, jailbreak, etc.
  3. llamar_modelo()      -> llama a Nikko via Ollama (local o RunPod)
  4. parsear_respuesta()  -> extrae JSON del texto crudo
  5. aplicar_guardrails() -> corrige nivel, categoria, recursos, etc.
  6. guardar en Mongo
  7. devolver al frontend

Para arrancar:
    uvicorn main:app --host 0.0.0.0 --port 8000
"""

import time
import hashlib
import secrets
from datetime import datetime, timezone
from typing import Optional

import boto3
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo import MongoClient

# Modulos propios
from config import (
    MONGODB_URL,
    MONGODB_DB,
    MONGODB_COLLECTION,
    NIKKO_MODEL_NAME,
    ENTORNO,
    imprimir_config,
    AWS_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_SESSION_TOKEN,
)
from consumir_nikko import (
    llamar_modelo,
    ping,
    modelo_disponible,
    ModeloTimeoutError,
    ModeloConexionError,
    _resolver_ollama_host,
)
from guardrails import (
    validar_input,
    parsear_respuesta_modelo,
    aplicar_guardrails,
    respuesta_input_invalido,
    MENSAJE_ERROR_TECNICO,
)


# ============================================================
# APLICACION FASTAPI
# ============================================================

app = FastAPI(
    title="Nikko - Asistente de prevencion de bullying",
    description="API que conecta el frontend con el modelo Nikko fine-tuneado",
    version="2.0.0",
)

# CORS para que el frontend (otro dominio) pueda llamar
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# MODELOS DE DATOS
# ============================================================

class Prompt(BaseModel):
    """Lo que envia el frontend a /chat"""
    prompt: str
    history: list[dict] = Field(default_factory=list)
    sessionId: Optional[str] = None
    nickname: Optional[str] = None


class AuthRequest(BaseModel):
    nickname: str
    password: str


class NicknameUpdateRequest(BaseModel):
    newNickname: str


class TTSRequest(BaseModel):
    text: str
    voiceId: str = "Raul"


SESSION_HISTORIES: dict[str, list[dict]] = {}
MAX_HISTORY_ITEMS = 20


def _normalizar_history(history: list[dict]) -> list[dict]:
    history_limpio = []

    for item in history or []:
        role = item.get("role")
        content = str(item.get("content", "")).strip()

        if role in {"user", "assistant"} and content:
            history_limpio.append({"role": role, "content": content})

    return history_limpio[-MAX_HISTORY_ITEMS:]


def _combinar_historiales(history_guardado: list[dict], history_cliente: list[dict]) -> list[dict]:
    history = []
    vistos = set()

    for item in [*(history_guardado or []), *(history_cliente or [])]:
        clave = (item.get("role"), item.get("content"))

        if clave not in vistos:
            history.append(item)
            vistos.add(clave)

    return history[-MAX_HISTORY_ITEMS:]


def _normalizar_nickname(nickname: str | None) -> str | None:
    if not nickname:
        return None

    nickname = nickname.strip().lower()
    return nickname or None


def _hash_password(password: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()


def _crear_titulo_chat(prompt: str) -> str:
    prompt = " ".join(prompt.strip().split())
    if not prompt:
        return "Nuevo chat"
    return prompt[:42] + ("..." if len(prompt) > 42 else "")


def _crear_cliente_polly():
    kwargs = {"region_name": AWS_REGION}

    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        kwargs["aws_access_key_id"] = AWS_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = AWS_SECRET_ACCESS_KEY

    if AWS_SESSION_TOKEN:
        kwargs["aws_session_token"] = AWS_SESSION_TOKEN

    return boto3.client("polly", **kwargs)


def _motores_polly_por_voz(voice_id: str) -> list[str]:
    motores = {
        "Raul": ["long-form"],
        "Sergio": ["neural", "generative"],
        "Enrique": ["standard"],
    }
    return motores.get(voice_id, ["neural", "standard"])


def _contiene_situacion_bullying(texto: str) -> bool:
    texto = texto.lower()
    patrones = [
        "me pegan",
        "me pega",
        "me han pegado",
        "me insultan",
        "me amenaza",
        "me amenazan",
        "me acosan",
        "se rien de mi",
        "se burlan",
        "me empujan",
        "me chantajea",
        "me chantajean",
        "me esconden",
        "me dejan fuera",
        "nadie me habla",
        "todos los dias",
        "cada dia",
        "en clase",
    ]
    return any(patron in texto for patron in patrones)


def _crear_prompt_contextual(mensaje_actual: str, history: list[dict]) -> str:
    historial_previo = history[:-1]
    mensajes_usuario_previos = [
        item["content"] for item in historial_previo if item["role"] == "user"
    ]
    mensajes_relevantes_previos = [
        mensaje for mensaje in mensajes_usuario_previos
        if _contiene_situacion_bullying(mensaje)
    ]

    if not mensajes_relevantes_previos:
        return mensaje_actual

    es_respuesta_corta = len(mensaje_actual.split()) <= 4

    if not es_respuesta_corta or _contiene_situacion_bullying(mensaje_actual):
        return mensaje_actual

    contexto_usuario = " | ".join(mensajes_relevantes_previos[-4:])
    historial_formateado = []

    for item in historial_previo[-8:]:
        hablante = "Usuario" if item["role"] == "user" else "Nikko"
        historial_formateado.append(f"{hablante}: {item['content']}")

    ultimo_mensaje = (
        f'El usuario ahora responde: "{mensaje_actual}". '
        "Interpretalo como continuacion directa de la situacion previa."
        if es_respuesta_corta
        else f"Ultimo mensaje del usuario: {mensaje_actual}"
    )

    return "\n".join([
        "Continua esta conversacion de apoyo sobre bullying/acoso escolar.",
        "El ultimo mensaje no debe interpretarse aislado.",
        "Si el ultimo mensaje es corto, ambiguo o negativo, responde como continuacion directa del problema anterior.",
        "No digas que esta fuera de alcance si el historial previo habla de bullying, agresiones, insultos, amenazas o miedo.",
        "No acuses al usuario de amenazar a nadie; el usuario esta pidiendo ayuda.",
        "",
        f"Situacion previa contada por el usuario: {contexto_usuario}",
        "",
        "Historial reciente:",
        *historial_formateado,
        "",
        ultimo_mensaje,
    ])


def _mejorar_respuesta_con_contexto(
    mensaje_actual: str,
    history: list[dict],
    respuesta: dict,
) -> dict:
    texto = mensaje_actual.lower().strip()
    mensajes_previos_usuario = [
        item["content"].lower()
        for item in history[:-1]
        if item["role"] == "user"
    ]
    contexto_previo = " ".join(mensajes_previos_usuario)
    respuesta_corta_negativa = texto in {
        "no",
        "no puedo",
        "no puedo hacerlo",
        "no se",
        "no sé",
        "no tengo a nadie",
        "no quiero",
    }
    respuesta_corta_afirmativa = texto in {"si", "sí", "vale", "ok"}

    hay_agresion = any(
        patron in contexto_previo
        for patron in ["me pegan", "me pega", "me han pegado"]
    )
    hay_insultos = any(
        patron in contexto_previo
        for patron in ["me insultan", "me insulta", "insultos"]
    )

    if respuesta_corta_afirmativa and hay_agresion:
        respuesta.update({
            "nivel": 4,
            "categoria": "violencia_fisica",
            "accion": "denuncia_inmediata_y_atencion_medica",
            "requiere_alerta": True,
            "abrir_formulario": "denuncia",
            "recursos": ["jefatura", "conserjeria", "direccion", "profesor_de_guardia"],
            "telefonos": ["900018018", "112"],
            "respuesta_usuario": (
                "Vale. Hazlo lo mas sencillo posible: ve a un sitio con gente y busca a "
                "conserjeria, jefatura, direccion o un profesor de guardia. Puedes decir solo: "
                "me estan pegando y necesito ayuda ahora. Si te duele algo, tienes heridas o "
                "sigues en peligro, llama al 112."
            ),
        })

    elif respuesta_corta_negativa and hay_agresion and hay_insultos:
        respuesta.update({
            "nivel": 4,
            "categoria": "violencia_fisica",
            "accion": "denuncia_inmediata_y_atencion_medica",
            "requiere_alerta": True,
            "abrir_formulario": "denuncia",
            "recursos": ["jefatura", "conserjeria", "direccion", "profesor_de_guardia"],
            "telefonos": ["900018018", "112"],
            "respuesta_usuario": (
                "Entiendo que te bloquees y sientas que no puedes. Que te peguen y tambien "
                "te insulten no es una broma ni algo que tengas que aguantar. Da un paso muy "
                "pequeno: acercate a un sitio con gente y di solo esta frase a cualquier adulto "
                "del centro: me estan pegando e insultando y necesito ayuda ahora. Si no puedes "
                "hablar con tu tutor, busca conserjeria, jefatura, direccion o un profesor de guardia. "
                "Si estas en peligro ahora, llama al 112."
            ),
        })

    elif respuesta_corta_negativa and hay_agresion:
        respuesta.update({
            "nivel": 4,
            "categoria": "violencia_fisica",
            "accion": "denuncia_inmediata_y_atencion_medica",
            "requiere_alerta": True,
            "abrir_formulario": "denuncia",
            "recursos": ["jefatura", "conserjeria", "direccion", "profesor_de_guardia"],
            "telefonos": ["900018018", "112"],
            "respuesta_usuario": (
                "Entiendo que ahora sientas que no puedes. Si te pegan en clase, "
                "lo primero es ponerte en un lugar con gente y buscar a cualquier adulto "
                "del centro: conserjeria, jefatura, direccion o un profesor de guardia. "
                "No tienes que explicarlo perfecto; basta con decir: me estan pegando y necesito ayuda. "
                "Si esta pasando ahora o tienes miedo de que vuelva a pasar hoy, llama al 112."
            ),
        })

    elif respuesta_corta_negativa and hay_insultos:
        respuesta.update({
            "nivel": 2,
            "categoria": "acoso_recurrente",
            "accion": "derivacion_interna",
            "requiere_alerta": True,
            "abrir_formulario": None,
            "recursos": ["tutor", "orientadora", "jefatura"],
            "telefonos": ["900018018"],
            "respuesta_usuario": (
                "Entiendo que ahora no puedas contarlo facilmente. Si te insultan, puedes empezar "
                "con algo muy corto: me insultan en clase y necesito que me ayudes. Si no puedes "
                "decirselo a tu tutor, puedes escribirlo en una nota o buscar a orientacion, jefatura "
                "o un profesor con quien te sientas un poco mas seguro/a."
            ),
        })

    return respuesta


# ============================================================
# EVENTOS DE STARTUP / SHUTDOWN
# ============================================================

@app.on_event("startup")
def startup():
    """Se ejecuta al arrancar el servidor."""
    imprimir_config()

    # Conectar a MongoDB
    app.mongodb_client = MongoClient(MONGODB_URL)
    app.mongodb = app.mongodb_client[MONGODB_DB]
    app.mongo_collection = app.mongodb[MONGODB_COLLECTION]
    app.users_collection = app.mongodb["usuarios"]
    print(f"[OK] MongoDB: {MONGODB_DB}.{MONGODB_COLLECTION}")

    # Comprobar conexion con Ollama (no bloqueante)
    # Comprobar conexion con Ollama (no bloqueante)
    host_real = _resolver_ollama_host()

    if ping():
        print(f"[OK] Ollama responde en {host_real}")
        if modelo_disponible():
            print(f"[OK] Modelo {NIKKO_MODEL_NAME} cargado")
        else:
            print(f"[!] Modelo {NIKKO_MODEL_NAME} NO esta cargado")
            print(f"    Ejecuta: ollama create {NIKKO_MODEL_NAME} -f Modelfile")
    else:
        print(f"[!] Ollama NO responde en {host_real}")

@app.on_event("shutdown")
def shutdown():
    app.mongodb_client.close()
    print("[OK] MongoDB cerrado")


# ============================================================
# UTILIDADES INTERNAS
# ============================================================

def _guardar_en_mongo(
    request: Request,
    prompt: str,
    respuesta: dict,
    duracion_ms: int,
    prompt_modelo: str | None = None,
    history: list[dict] | None = None,
    nickname: str | None = None,
    chat_id: str | None = None,
) -> str:
    """
    Guarda la interaccion completa en MongoDB.
    Guarda el JSON entero de Nikko + metadatos.
    """
    message_index = 1

    if chat_id:
        message_index = request.app.mongo_collection.count_documents({"chat_id": chat_id}) + 1

    documento = {
        "nickname": nickname,
        "chat_id": chat_id,
        "chat_title": _crear_titulo_chat(prompt) if message_index == 1 else None,
        "message_index": message_index,
        "prompt": prompt,
        "prompt_modelo": prompt_modelo,
        "history": history or [],
        "nivel": respuesta.get("nivel"),
        "categoria": respuesta.get("categoria"),
        "accion": respuesta.get("accion"),
        "recursos": respuesta.get("recursos", []),
        "telefonos": respuesta.get("telefonos", []),
        "requiere_alerta": respuesta.get("requiere_alerta", False),
        "abrir_formulario": respuesta.get("abrir_formulario"),
        "respuesta_usuario": respuesta.get("respuesta_usuario"),
        "model": NIKKO_MODEL_NAME,
        "source": ENTORNO,
        "duracion_ms": duracion_ms,
        "created_at": datetime.now(timezone.utc),
    }
    resultado = request.app.mongo_collection.insert_one(documento)
    return str(resultado.inserted_id)


# ============================================================
# ENDPOINTS
# ============================================================

@app.get("/")
def home():
    """Informacion general de la API."""
    return {
        "status": "Nikko API funcionando",
        "version": "2.0.0",
        "entorno": ENTORNO,
        "modelo": NIKKO_MODEL_NAME,
        "endpoints": [
            "GET  /",
            "POST /chat",
            "GET  /health",
            "GET  /grafana/interacciones",
            "GET  /grafana/stats",
        ],
    }


@app.get("/health")
def health():
    """Healthcheck para Docker, Kubernetes o Grafana."""
    ollama_ok = ping()
    modelo_ok = modelo_disponible() if ollama_ok else False
    estado = "ok" if (ollama_ok and modelo_ok) else "degraded"

    return {
        "status": estado,
        "ollama": ollama_ok,
        "modelo_cargado": modelo_ok,
        "entorno": ENTORNO,
        "modelo": NIKKO_MODEL_NAME,
    }


@app.post("/tts")
def tts(data: TTSRequest):
    texto = (data.text or "").strip()

    if not texto:
        raise HTTPException(status_code=400, detail="texto_requerido")

    if len(texto) > 1500:
        texto = texto[:1500]

    try:
        polly = _crear_cliente_polly()
        voice_id = data.voiceId or "Raul"
        ultimo_error = None

        for engine in _motores_polly_por_voz(voice_id):
            try:
                response = polly.synthesize_speech(
                    Text=texto,
                    OutputFormat="mp3",
                    VoiceId=voice_id,
                    Engine=engine,
                )
                break
            except Exception as e:
                ultimo_error = e
        else:
            raise ultimo_error

        audio = response["AudioStream"].read()
        return Response(
            content=audio,
            media_type="audio/mpeg",
            headers={"Cache-Control": "no-store"},
        )
    except Exception as e:
        print(f"[POLLY] Error generando audio: {e}")
        raise HTTPException(status_code=503, detail="tts_no_disponible")


@app.post("/auth/register")
def register(data: AuthRequest, request: Request):
    nickname = _normalizar_nickname(data.nickname)
    password = data.password.strip()

    if not nickname or len(nickname) < 2:
        raise HTTPException(status_code=400, detail="nickname_invalido")

    if len(password) < 4:
        raise HTTPException(status_code=400, detail="password_corta")

    if request.app.users_collection.find_one({"nickname": nickname}):
        raise HTTPException(status_code=409, detail="nickname_ya_existe")

    salt = secrets.token_hex(16)
    request.app.users_collection.insert_one({
        "nickname": nickname,
        "password_hash": _hash_password(password, salt),
        "salt": salt,
        "created_at": datetime.now(timezone.utc),
    })

    return {"ok": True, "nickname": nickname}


@app.post("/auth/login")
def login(data: AuthRequest, request: Request):
    nickname = _normalizar_nickname(data.nickname)
    password = data.password.strip()
    user = request.app.users_collection.find_one({"nickname": nickname})

    if not user:
        raise HTTPException(status_code=401, detail="credenciales_invalidas")

    password_hash = _hash_password(password, user["salt"])

    if password_hash != user["password_hash"]:
        raise HTTPException(status_code=401, detail="credenciales_invalidas")

    return {"ok": True, "nickname": nickname}


@app.patch("/users/{nickname}/nickname")
def actualizar_nickname(nickname: str, data: NicknameUpdateRequest, request: Request):
    old_nickname = _normalizar_nickname(nickname)
    new_nickname = _normalizar_nickname(data.newNickname)

    if not old_nickname or not new_nickname or len(new_nickname) < 2:
        raise HTTPException(status_code=400, detail="nickname_invalido")

    if old_nickname == new_nickname:
        return {"ok": True, "nickname": old_nickname}

    if request.app.users_collection.find_one({"nickname": new_nickname}):
        raise HTTPException(status_code=409, detail="nickname_ya_existe")

    user_result = request.app.users_collection.update_one(
        {"nickname": old_nickname},
        {"$set": {"nickname": new_nickname, "updated_at": datetime.now(timezone.utc)}},
    )

    if user_result.matched_count == 0:
        request.app.users_collection.insert_one({
            "nickname": new_nickname,
            "password_hash": None,
            "salt": None,
            "created_at": datetime.now(timezone.utc),
        })

    interactions_result = request.app.mongo_collection.update_many(
        {"nickname": old_nickname},
        {"$set": {"nickname": new_nickname}},
    )

    return {
        "ok": True,
        "nickname": new_nickname,
        "updated_chats": interactions_result.modified_count,
    }


@app.get("/chats/{nickname}")
def listar_chats(nickname: str, request: Request):
    nickname = _normalizar_nickname(nickname)
    pipeline = [
        {"$match": {"nickname": nickname, "chat_id": {"$ne": None}}},
        {"$sort": {"created_at": 1}},
        {"$group": {
            "_id": "$chat_id",
            "title": {"$first": {"$ifNull": ["$chat_title", "$prompt"]}},
            "last_prompt": {"$last": "$prompt"},
            "last_response": {"$last": "$respuesta_usuario"},
            "updated_at": {"$last": "$created_at"},
            "count": {"$sum": 1},
        }},
        {"$sort": {"updated_at": -1}},
    ]
    chats = []

    for item in request.app.mongo_collection.aggregate(pipeline):
        updated_at = item.get("updated_at")
        chats.append({
            "chat_id": item["_id"],
            "title": item.get("title") or item.get("last_prompt") or "Chat",
            "last_prompt": item.get("last_prompt"),
            "last_response": item.get("last_response"),
            "updated_at": updated_at.isoformat() if updated_at else None,
            "count": item.get("count", 0),
        })

    return {"chats": chats}


@app.get("/chats/{nickname}/{chat_id}")
def obtener_chat(nickname: str, chat_id: str, request: Request):
    nickname = _normalizar_nickname(nickname)
    items = request.app.mongo_collection.find({
        "nickname": nickname,
        "chat_id": chat_id,
    }).sort("message_index", 1)
    messages = []

    for item in items:
        created_at = item.get("created_at")
        messages.append({
            "prompt": item.get("prompt", ""),
            "respuesta_usuario": item.get("respuesta_usuario", ""),
            "created_at": created_at.isoformat() if created_at else None,
        })

    return {"chat_id": chat_id, "messages": messages}


@app.delete("/chats/{nickname}/{chat_id}")
def borrar_chat(nickname: str, chat_id: str, request: Request):
    nickname = _normalizar_nickname(nickname)
    resultado = request.app.mongo_collection.delete_many({
        "nickname": nickname,
        "chat_id": chat_id,
    })

    SESSION_HISTORIES.pop(chat_id, None)

    return {
        "ok": True,
        "deleted_count": resultado.deleted_count,
    }


@app.post("/chat")
def chat(data: Prompt, request: Request):
    """
    Endpoint principal: recibe mensaje del usuario y devuelve
    la respuesta de Nikko con guardrails aplicados.

    Frontend envia:
        POST /chat
        Content-Type: application/json
        {"prompt": "Me han amenazado con pegarme"}

    Frontend recibe (los 8 campos de Nikko + metadatos):
        {
            "nivel": 3,
            "categoria": "amenaza_de_violencia",
            "accion": "proteccion_inmediata_y_derivacion",
            "recursos": ["jefatura", "conserjeria", "familia"],
            "telefonos": ["900018018"],
            "requiere_alerta": true,
            "abrir_formulario": "aviso",
            "respuesta_usuario": "Lo que me cuentas es muy grave...",
            "mongo_id": "...",
            "duracion_ms": 2340
        }
    """
    prompt_usuario = (data.prompt or "").strip()
    session_id = data.sessionId or request.client.host or "default"
    nickname = _normalizar_nickname(data.nickname)
    inicio = time.time()

    # ---- 1. Validar entrada con TU guardrails -----------------------
    rechazo = validar_input(prompt_usuario)
    if rechazo is not None:
        # validar_input devuelve un mensaje string si rechaza
        print(f"[VALIDACION] Mensaje rechazado: {rechazo[:80]}")
        respuesta = respuesta_input_invalido(rechazo)

        try:
            mongo_id = _guardar_en_mongo(
                request,
                prompt_usuario,
                respuesta,
                0,
                nickname=nickname,
                chat_id=session_id,
            )
            respuesta["mongo_id"] = mongo_id
        except Exception as e:
            print(f"[!] Error guardando en Mongo: {e}")
            respuesta["mongo_id"] = None

        respuesta["duracion_ms"] = 0
        return respuesta

    history_cliente = _normalizar_history(data.history)
    history_guardado = SESSION_HISTORIES.get(session_id, [])
    history = _combinar_historiales(history_guardado, history_cliente)

    if not (
        history
        and history[-1].get("role") == "user"
        and history[-1].get("content") == prompt_usuario
    ):
        history = [*history, {"role": "user", "content": prompt_usuario}]

    history = history[-MAX_HISTORY_ITEMS:]
    prompt_modelo = _crear_prompt_contextual(prompt_usuario, history)

    # ---- 2. Llamar al modelo Nikko --------------------------
    try:
        texto_crudo = llamar_modelo(prompt_modelo)
    except ModeloTimeoutError as e:
        print(f"[TIMEOUT] {e}")
        duracion_ms = int((time.time() - inicio) * 1000)
        respuesta = {
            "nivel": -1,
            "categoria": "error_sistema",
            "accion": "reintentar",
            "recursos": [],
            "telefonos": [],
            "requiere_alerta": False,
            "abrir_formulario": None,
            "respuesta_usuario": MENSAJE_ERROR_TECNICO,
            "duracion_ms": duracion_ms,
        }
        try:
            mongo_id = _guardar_en_mongo(
                request,
                prompt_usuario,
                respuesta,
                duracion_ms,
                prompt_modelo=prompt_modelo,
                history=history,
                nickname=nickname,
                chat_id=session_id,
            )
            respuesta["mongo_id"] = mongo_id
        except Exception as mongo_error:
            print(f"[!] Error guardando timeout en Mongo: {mongo_error}")
            respuesta["mongo_id"] = None

        return respuesta
    except ModeloConexionError as e:
        print(f"[CONEXION] {e}")
        duracion_ms = int((time.time() - inicio) * 1000)
        respuesta = {
            "nivel": -1,
            "categoria": "error_sistema",
            "accion": "reintentar",
            "recursos": [],
            "telefonos": [],
            "requiere_alerta": False,
            "abrir_formulario": None,
            "respuesta_usuario": "Lo siento, ahora mismo no puedo conectar con el servidor de Nikko. Intentelo de nuevo en unos segundos.",
            "duracion_ms": duracion_ms,
        }
        try:
            mongo_id = _guardar_en_mongo(
                request,
                prompt_usuario,
                respuesta,
                duracion_ms,
                prompt_modelo=prompt_modelo,
                history=history,
                nickname=nickname,
                chat_id=session_id,
            )
            respuesta["mongo_id"] = mongo_id
        except Exception as mongo_error:
            print(f"[!] Error guardando fallo de conexion en Mongo: {mongo_error}")
            respuesta["mongo_id"] = None

        return respuesta

    # ---- 3. Parsear respuesta del modelo --------------------
    data_modelo = parsear_respuesta_modelo(texto_crudo)

    # ---- 4. Aplicar guardrails (con mensaje del usuario) ----
    respuesta = aplicar_guardrails(data_modelo, mensaje_usuario=prompt_modelo)
    respuesta = _mejorar_respuesta_con_contexto(prompt_usuario, history, respuesta)

    duracion_ms = int((time.time() - inicio) * 1000)

    # ---- 5. Guardar en MongoDB ------------------------------
    try:
        mongo_id = _guardar_en_mongo(
            request,
            prompt_usuario,
            respuesta,
            duracion_ms,
            prompt_modelo=prompt_modelo,
            history=history,
            nickname=nickname,
            chat_id=session_id,
        )
        respuesta["mongo_id"] = mongo_id
    except Exception as e:
        print(f"[!] Error guardando en Mongo: {e}")
        respuesta["mongo_id"] = None

    respuesta["duracion_ms"] = duracion_ms
    SESSION_HISTORIES[session_id] = [
        *history,
        {"role": "assistant", "content": respuesta.get("respuesta_usuario", "")},
    ][-MAX_HISTORY_ITEMS:]

    print(f"[OK] /chat - nivel={respuesta.get('nivel')} duracion={duracion_ms}ms")

    return respuesta


# ============================================================
# ENDPOINTS PARA GRAFANA
# ============================================================

@app.get("/grafana/interacciones")
def grafana_interacciones(request: Request):
    """
    Endpoint para Grafana: devuelve todas las interacciones
    en formato compatible con paneles temporales.
    """
    datos = list(request.app.mongo_collection.find())

    resultado = []
    for item in datos:
        resultado.append({
            "time": int(item["created_at"].timestamp() * 1000),
            "nivel": int(item.get("nivel", 0)) if item.get("nivel") is not None else 0,
            "categoria": item.get("categoria", ""),
            "duracion_ms": item.get("duracion_ms", 0),
        })

    return resultado


@app.get("/grafana/stats")
def grafana_stats(request: Request):
    """
    Estadisticas agregadas para dashboard:
      - Total de interacciones
      - Distribucion por nivel
      - Distribucion por categoria
      - Latencia promedio
    """
    total = request.app.mongo_collection.count_documents({})

    pipeline_nivel = [
        {"$group": {"_id": "$nivel", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    por_nivel = list(request.app.mongo_collection.aggregate(pipeline_nivel))

    pipeline_cat = [
        {"$group": {"_id": "$categoria", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    por_categoria = list(request.app.mongo_collection.aggregate(pipeline_cat))

    pipeline_lat = [
        {"$group": {"_id": None, "avg_ms": {"$avg": "$duracion_ms"}}},
    ]
    lat = list(request.app.mongo_collection.aggregate(pipeline_lat))
    latencia_promedio = lat[0]["avg_ms"] if lat else 0

    return {
        "total_interacciones": total,
        "por_nivel": [{"nivel": x["_id"], "count": x["count"]} for x in por_nivel],
        "por_categoria": [{"categoria": x["_id"], "count": x["count"]} for x in por_categoria],
        "latencia_promedio_ms": round(latencia_promedio or 0, 2),
    }
