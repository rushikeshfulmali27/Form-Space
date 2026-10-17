import {env} from 'cloudflare:workers';
import {statusResponse} from '../../../../server/generate.js';
export function GET() { return statusResponse(env); }
