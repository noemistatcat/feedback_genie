import { NextRequest, NextResponse } from 'next/server';
import { Analysis } from '@/lib/types';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { responses, context } = body;

    // Validate input
    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        { error: 'Responses array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (responses.length < 10 || responses.length > 10000) {
      return NextResponse.json(
        { error: 'Responses must be between 10 and 10,000' },
        { status: 400 }
      );
    }

    // Call Python backend
    const pythonResponse = await fetch(`${PYTHON_API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        responses,
        method: 'auto',
        context,
      }),
    });

    if (!pythonResponse.ok) {
      const error = await pythonResponse.json();
      throw new Error(error.detail || 'Python API error');
    }

    const result = await pythonResponse.json();

    // Transform Python response to match TypeScript Analysis type
    const analysis: Analysis = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      themes: result.themes.map((theme: any) => ({
        id: theme.id,
        name: theme.name,
        description: theme.description,
        responseIndices: theme.response_indices,
        representativeQuotes: theme.representative_quotes,
        count: theme.count,
        percentage: theme.percentage,
        confidence: theme.confidence,
      })),
      totalResponses: result.total_responses,
      assignedCount: result.assigned_count,
      unassignedIndices: result.unassigned_indices,
      coveragePercentage: result.coverage_percentage,
      processingTime: result.processing_time_ms,
      modelUsed: result.model_used || 'gemini-1.5-flash-latest',
      createdAt: new Date(),
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { error: 'Python analysis service is not running. Please start it with: uvicorn analysis.api:app --reload --port 8000' },
          { status: 503 }
        );
      }

      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service configuration error. Please check server settings.' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: `Analysis failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred during analysis' },
      { status: 500 }
    );
  }
}
