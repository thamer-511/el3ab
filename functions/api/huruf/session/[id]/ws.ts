export interface Env {
  HURUF_SESSION_DO: DurableObjectNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const id = context.params.id;
  if (!id || typeof id !== 'string') {
    return new Response('Missing session id', { status: 400 });
  }

  const doId = context.env.HURUF_SESSION_DO.idFromString(id);
  const stub = context.env.HURUF_SESSION_DO.get(doId);

  const headers = new Headers();
  for (const [key, value] of context.request.headers.entries()) {
    headers.set(key, value);
  }

  return stub.fetch(`https://huruf.internal/ws?${new URL(context.request.url).searchParams.toString()}`, {
    method: 'GET',
    headers,
  });
};
