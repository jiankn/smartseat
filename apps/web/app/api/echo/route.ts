import { ok, err } from '@smartseat/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('fail') === '1') {
    return err('DEMO_FAIL', 'You asked me to fail', 400);
  }
  return ok({ message: 'hello', time: new Date().toISOString() });
}

export async function POST(req: Request) {
  const data = (await req.json().catch(() => null)) as { name?: string } | null;
  if (!data?.name) return err('VALIDATION', 'name is required', 422);
  return ok({ greeting: `hi, ${data.name}` });
}
