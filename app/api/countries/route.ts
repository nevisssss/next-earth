import { NextResponse } from 'next/server';
import { getCountries } from '@/app/lib/data';

export async function GET() {
  try {
    const countries = await getCountries();
    return NextResponse.json({ countries });
  } catch (error) {
    console.error('countries_fetch_error', error);
    return NextResponse.json(
      { error: 'Unable to load country catalog' },
      { status: 500 },
    );
  }
}
