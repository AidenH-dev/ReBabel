export default async function fetcher(url) {
  const res = await fetch(url);
  const json = await res.json();

  if (!res.ok || json.success === false) {
    const error = new Error(json.error || `Request failed: ${res.status}`);
    error.status = res.status;
    error.info = json;
    throw error;
  }

  return json;
}
