import {env} from 'cloudflare:workers';
import {handleGeneration} from '../../../server/generate.js';
export function POST(request: Request) { return handleGeneration(request,env); }
