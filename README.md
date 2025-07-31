# Apify Actor Runner

A lightweight web app for running Apify actors through a simple browser interface. Enter your API token, select an actor, configure inputs, and run it. No frameworks, no complexity.

## Features

- Token-based authentication using your Apify API key
- Automatically loads your available actors
- Generates input forms from each actor's input schema
- Runs the selected actor and shows results
- Friendly error handling and minimal interface

## Requirements

- Python 3.7 or newer
- An Apify account with an API token  
  [Get yours here](https://console.apify.com/account#/integrations)

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/prajwal-38/apify-actor-runner
cd apify-actor-runner
pip install -r requirements.txt
```

Run the server:

```bash
python app.py
```
Then open your browser at:
```bash
http://localhost:5000
```
## Usage

Enter your Apify API token

Pick an actor from the list

Fill in the inputs (form is auto-generated)

Click "Run Actor" to execute and see results

Use "Start Over" to run a different actor

