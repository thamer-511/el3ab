import { HurufSessionDO } from './do/HurufSessionDO';

export { HurufSessionDO };

export default {
  async fetch(request: Request): Promise<Response> {
    return new Response(`No route matched: ${new URL(request.url).pathname}`, { status: 404 });
  },
};
