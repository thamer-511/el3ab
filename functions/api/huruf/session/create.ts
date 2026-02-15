export interface Env {
  HURUF_SESSION_DO: DurableObjectNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const name = crypto.randomUUID();
  const id = context.env.HURUF_SESSION_DO.idFromName(name);
  const stub = context.env.HURUF_SESSION_DO.get(id);

  await stub.fetch('https://huruf.internal/init', { method: 'POST' });

  return new Response(JSON.stringify({ sessionId: id.toString() }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
