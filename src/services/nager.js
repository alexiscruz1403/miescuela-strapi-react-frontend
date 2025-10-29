const BASE_URL = 'https://date.nager.at/api/v3';

// Obtiene todos los feriados públicos de un año para un país (ISO 3166-1 alpha-2)
export async function getPublicHolidays(year, countryCode = 'AR') {
  const res = await fetch(`${BASE_URL}/PublicHolidays/${year}/${countryCode}`);
  if (!res.ok) {
    throw new Error(`Error al obtener feriados: ${res.status}`);
  }
  return res.json();
}

// Obtiene los feriados del mes dado (por defecto el mes actual)
export async function getMonthlyHolidays(countryCode = 'AR', date = new Date()) {
  const year = date.getFullYear();
  const monthIndex = date.getMonth(); // 0-11
  const all = await getPublicHolidays(year, countryCode);
  return all.filter((h) => {
    const d = new Date(h.date);
    return d.getMonth() === monthIndex;
  });
}

