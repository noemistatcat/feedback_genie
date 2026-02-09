# Feedback Genie

An AI-powered tool for analyzing open-ended survey responses and product reviews. Automatically identifies themes and patterns using Google Gemini.

## Features

- **CSV Upload** - Drag and drop CSV files (10-10,000 responses)
- **Multi-theme Assignment** - Responses can belong to multiple themes
- **Hybrid AI Analysis** - Combines embeddings + clustering + LLM labeling
- **Smart Routing** - Pure LLM for small datasets, hybrid for large datasets
- **Interactive Codeframe** - Drag-and-drop theme assignment with color coding
- **Theme Management** - Edit, merge, split, or delete themes
- **Export** - Download results as CSV or JSON

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend**: Python with FastAPI
- **AI**: Google Gemini (embeddings + text generation)
- **ML**: scikit-learn for clustering

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone and install dependencies**
```bash
git clone <your-repo-url>
cd feedback-genie
npm install
```

2. **Set up Python environment**
```bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Configure environment**
```bash
cp .env.example .env.local
```

Add your Gemini API key to `.env.local`:
```
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

4. **Run the app**
```bash
npm run dev
```

This starts both servers:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## Usage

1. **Upload** - Drag and drop a CSV file with survey responses
2. **Select Column** - Choose the column containing text to analyze
3. **Analyze** - Click "Analyze Responses" (15-60 seconds)
4. **Review** - Browse themes in card view or codeframe view
5. **Refine** - Edit themes, drag responses to reassign
6. **Export** - Download as CSV or JSON

## Project Structure

```
feedback-genie/
├── app/                    # Next.js app router
│   ├── api/analyze/        # Analysis API endpoint
│   └── page.tsx            # Main page
├── components/
│   ├── analysis/           # Theme display & editing
│   │   └── codeframe/      # Codeframe view components
│   ├── upload/             # File upload
│   ├── export/             # Export functionality
│   └── ui/                 # Reusable UI components
├── lib/
│   ├── csv/                # CSV parsing & export
│   ├── theme-colors.ts     # Theme color palette
│   └── types.ts            # TypeScript types
├── context/                # React context (state management)
└── analysis/               # Python backend
    ├── api.py              # FastAPI endpoints
    ├── pipeline.py         # Analysis orchestration
    ├── embeddings.py       # Embedding generation
    ├── clustering.py       # K-means clustering
    ├── labeling.py         # LLM theme labeling
    ├── preprocessing.py    # Text preprocessing
    ├── chunking.py         # Large dataset handling
    ├── models.py           # Pydantic schemas
    └── config.py           # Configuration
```

## License

MIT
