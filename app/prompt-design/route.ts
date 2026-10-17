import html from '../../public/studio/prompt-design.html?raw';
export function GET() { return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}}); }
