# ClarityLedger

A simple and elegant personal finance manager to track your income and expenses, with AI-powered financial tips. User data is stored locally in the browser.

## Features

*   **Income and Expense Tracking:** Easily record your income and expenses.
*   **AI-Powered Financial Tips:** Get personalized financial advice.
*   **Local Data Storage:** User data is stored securely in the browser.
*   **Modern UI:** Built with React and Vite for a fast and responsive user experience.
*   **Data Visualization:** Utilizes Recharts for visualizing financial data.
*   **OCR Functionality:** Uses Tesseract.js for Optical Character Recognition (version 5).

## Technologies Used

*   [React](https://react.dev/): A JavaScript library for building user interfaces.
*   [Vite](https://vitejs.dev/): A fast and modern build tool.
*   [Recharts](https://recharts.org/): A composable charting library built on React.
*   [Tesseract.js](https://tesseract.projectnaptha.com/): A pure JavaScript OCR engine.

## Prerequisites

*   [Node.js](https://nodejs.org/)

## Installation

1.  Clone the repository:

    ```bash
    git clone <repository_url>
    cd clarityledger
    ```
2.  Install dependencies:

    ```bash
    npm install
    ```

## Configuration

1.  Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key.  You may need to create this file if it doesn't exist.

    ```
    GEMINI_API_KEY=YOUR_API_KEY
    ```

## Development

1.  Run the app:

    ```bash
    npm run dev
    ```

    This will start the development server. Open your browser and navigate to the address provided (usually `http://localhost:5173/`).

## Building for Production

1.  Build the app:

    ```bash
    npm run build
    ```

    This will create a `dist` directory containing the production-ready build.

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

## License

[Specify the license here, e.g., MIT License]
