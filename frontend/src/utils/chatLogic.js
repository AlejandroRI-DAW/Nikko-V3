// Keywords for severity detection
const severeKeywords = [
  "suicidio", "suicidarme", "matarme", "morir", "muerte",
  "pegarme", "golpearme", "amenazar", "amenaza", "arma",
  "violencia física", "sangre", "herida", "lastimar",
  "peligro", "miedo extremo", "me van a matar"
];

const moderateKeywords = [
  "acoso", "bullying", "insulto", "insultan", "humillan",
  "excluyen", "ignoran", "burlan", "molestan", "abusan",
  "discriminan", "rechazan", "odio", "solo", "sola",
  "triste", "llorar", "ansiedad", "miedo", "vergüenza",
  "grupo", "todos contra", "nadie me habla"
];

export function analyzeSeverity(message) {
  const lowerMessage = message.toLowerCase();
  
  // Check for severe keywords
  if (severeKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return "severe";
  }
  
  // Check for moderate keywords
  if (moderateKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return "moderate";
  }
  
  return "normal";
}

export function getBotResponse(userMessage, severity) {
  const lowerMessage = userMessage.toLowerCase();

  // Severe responses
  if (severity === "severe") {
    if (lowerMessage.includes("suicid") || lowerMessage.includes("morir") || lowerMessage.includes("matarme")) {
      return `Entiendo que estás pasando por un momento muy difícil. Tu vida es muy valiosa y hay personas que pueden ayudarte ahora mismo.

🚨 Por favor, contacta inmediatamente:
• Línea de Prevención del Suicidio: 024
• Teléfono de Emergencias: 112
• ANAR (Ayuda a Niños): 900 20 20 10

No estás solo/a en esto. Hablar con un profesional puede marcar una gran diferencia. ¿Hay un adulto de confianza cerca de ti ahora?`;
    }
    
    if (lowerMessage.includes("pegar") || lowerMessage.includes("golpe") || lowerMessage.includes("violencia")) {
      return `Lo que describes es violencia física y es muy grave. Nadie tiene derecho a lastimarte físicamente.

🚨 Es importante que actúes ahora:
• Busca un adulto de confianza inmediatamente (padre, madre, profesor, orientador)
• Si estás en peligro, llama al 112
• Documenta cualquier lesión o amenaza

Tu seguridad es lo más importante. ¿Puedes hablar con alguien de confianza en este momento?`;
    }

    return `La situación que describes me preocupa mucho. Tu seguridad y bienestar son lo más importantes.

🚨 Te recomiendo buscar ayuda inmediata:
• Habla con un adulto de confianza
• Llama a una línea de ayuda: 900 20 20 10
• En caso de emergencia: 112

Por favor, no enfrentes esto solo/a. Hay personas preparadas para ayudarte. ¿Necesitas información sobre recursos de ayuda?`;
  }

  // Moderate responses
  if (severity === "moderate") {
    if (lowerMessage.includes("insulto") || lowerMessage.includes("humilla")) {
      return `Lamento mucho que estés pasando por esto. Los insultos y la humillación son formas de acoso que no debes tolerar.

💙 Algunos pasos que puedes seguir:
• Habla con un profesor o el orientador escolar sobre lo que está pasando
• No respondas con insultos, eso puede empeorar la situación
• Apóyate en tus amigos verdaderos y tu familia
• Guarda evidencia si los insultos son por mensajes o redes sociales

Recuerda: el problema no eres tú, sino quienes acosan. ¿Te gustaría saber más sobre cómo manejar esta situación?`;
    }

    if (lowerMessage.includes("solo") || lowerMessage.includes("sola") || lowerMessage.includes("excluyen")) {
      return `Sentirse excluido/a duele mucho, y quiero que sepas que tus sentimientos son válidos.

💜 Recuerda:
• Tu valor no depende de si te incluyen o no en un grupo
• La exclusión dice más de ellos que de ti
• Hay personas que sí querrán conocerte y valorarte
• Busca actividades donde puedas conocer gente con tus intereses

¿Has hablado con algún adulto de confianza sobre cómo te sientes? A veces pueden ayudarte a ver la situación desde otra perspectiva.`;
    }

    if (lowerMessage.includes("miedo") || lowerMessage.includes("ansiedad")) {
      return `Es completamente normal sentir miedo ante situaciones de acoso. Tu bienestar emocional es importante.

💚 Algunas estrategias que pueden ayudarte:
• Respiraciones profundas cuando sientas ansiedad
• Habla con alguien de confianza sobre lo que sientes
• Escribe tus sentimientos en un diario
• Busca apoyo del orientador escolar o un psicólogo

No tienes que cargar con este peso tú solo/a. ¿Hay alguien en tu familia o escuela con quien te sientas cómodo/a hablando?`;
    }

    return `Entiendo que lo que estás viviendo es difícil. El acoso escolar es un problema serio que merece atención.

💙 Te sugiero:
• Documenta lo que está pasando (fechas, lugares, testigos)
• Habla con un adulto de confianza (padres, profesor, orientador)
• No te aísles, busca apoyo en amigos y familia
• Recuerda que no es tu culpa

Estoy aquí para escucharte. ¿Quieres contarme más sobre tu situación?`;
  }

  // Normal/supportive responses
  const supportiveResponses = [
    `Gracias por compartir eso conmigo. Estoy aquí para escucharte sin juzgarte. ¿Hay algo más que te gustaría contarme?`,
    
    `Te escucho. Es valiente de tu parte hablar sobre esto. ¿Cómo te hace sentir esta situación?`,
    
    `Aprecio tu confianza al compartir esto. Recuerda que siempre hay soluciones y personas dispuestas a ayudar. ¿Qué más te preocupa?`,
    
    `Entiendo. Es importante que expreses lo que sientes. ¿Has podido hablar con alguien más sobre esto?`,
  ];

  // Check for specific questions
  if (lowerMessage.includes("qué hago") || lowerMessage.includes("que hago") || lowerMessage.includes("ayuda")) {
    return `Estoy aquí para ayudarte. Para darte el mejor apoyo, cuéntame más sobre tu situación:

• ¿Qué está pasando exactamente?
• ¿Hace cuánto tiempo ocurre?
• ¿Hay alguien más involucrado?
• ¿Has hablado con algún adulto al respecto?

Toda la información que compartas es confidencial y me ayudará a orientarte mejor.`;
  }

  if (lowerMessage.includes("gracias")) {
    return `No tienes nada que agradecer. Estoy aquí para ti siempre que lo necesites. Tu bienestar es importante. 💙

¿Hay algo más en lo que pueda ayudarte?`;
  }

  // Return a random supportive response
  return supportiveResponses[Math.floor(Math.random() * supportiveResponses.length)];
}
