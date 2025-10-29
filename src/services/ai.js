// Servicio para generar informes con IA
// Opciones de configuración:
// - Recomendado: defina VITE_AI_PROXY_URL y maneje el secreto en el backend
// - Solo desarrollo: defina VITE_OPENAI_API_KEY para llamar a OpenAI directo desde el cliente

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export async function generarInformePedagogicoAI({ informes = [], contexto = {} }) {
  const proxyUrl = import.meta.env.VITE_AI_PROXY_URL;
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  const { curso, alumno, materia } = contexto;

  const resumenIntervenciones = informes
    .map((inf, idx) => `- [${idx + 1}] ${inf.fecha} • ${inf.materia || ''} • ${inf.asesorPedagogico}: ${inf.contenido}`.trim())
    .join('\n');

  const system = `Eres un asesor pedagógico senior. Redacta un informe pedagógico claro, breve (300-500 palabras), en español neutro, con:
  - Introducción con datos contextuales (curso, alumno, materia si aplica)
  - Síntesis de intervenciones relevantes (fechas y foco)
  - Conculusiones claves sobre cada intervención
  - Observaciones sobre avances y dificultades
  - Recomendaciones concretas (3-5 bullet points)
  - Cierre con próximos pasos y responsables`;

  const user = `Genera el informe a partir de estas intervenciones de asesores.
  Contexto:
  - Curso: ${curso ? (curso.name || curso) : 'N/D'}
  - Alumno: ${alumno ? (alumno.usuario ? `${alumno.usuario.apellido} ${alumno.usuario.nombre}` : alumno) : 'N/D'}
  - Materia: ${materia ? (materia.nombre || materia) : 'General'}

  Intervenciones:
  ${resumenIntervenciones || '(sin registros)'}

  Formatea con subtítulos en mayúsculas (Introducción, Síntesis, Observaciones, Recomendaciones, Cierre).`;

  // Preferir proxy backend (no exponer clave en el cliente)
  if (proxyUrl) {
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, user, meta: { curso, alumno, materia } }),
    });
    if (!res.ok) throw new Error(`AI proxy error: ${res.status}`);
    const data = await res.json();
    // Se espera { text: string } o { choices: [...] }
    if (data.text) return data.text;
    if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
    throw new Error('Respuesta de proxy AI inesperada');
  }

  // Solo desarrollo: llamada directa a OpenAI (requiere exponer API key en cliente)
  if (!apiKey) throw new Error('Configurar VITE_AI_PROXY_URL o VITE_OPENAI_API_KEY');

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.4,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

