import { http } from '@/app/http';

export const runtime = 'edge';
export const dynamic = 'force-dynamic'; // static by default, unless reading the request

export async function GET(request: Request) {
  const { data } = await http.get('https://google.com');
  return new Response(`Hello from ${process.env.VERCEL_REGION} ${data.length}`);
}
