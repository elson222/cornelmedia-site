# Evanex Pharmacy Website

A professional, static website for Evanex Pharmacy in Tarkwa-Nsuaem, Ghana.

## Structure

- `index.html`: Home page
- `about.html`: About Us page
- `services.html`: Services listing
- `contact.html`: Contact form and map
- `css/styles.css`: Main stylesheet
- `js/main.js`: Mobile navigation logic
- `images/`: Site assets

## Local Development

To view the site locally, simply open `index.html` in your web browser.

## Deployment Instructions (GitHub Pages)

### 1. Initialize Git Repository

Run these commands in your terminal inside this folder:

```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. Create and Push to GitHub

1. Create a new repository named `evanex-pharmacy` on GitHub.
2. Link your local repo to GitHub (replace `YOUR_USERNAME`):

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/evanex-pharmacy.git
git push -u origin main
```

### 3. Configure Details

1. Go to your repository **Settings** on GitHub.
2. Click **Pages** in the left sidebar.
3. Under **Build and deployment**:
   - Source: `Deploy from a branch`
   - Branch: `main` (or `gh-pages` if you prefer)
   - Folder: `/ (root)`
4. Click **Save**.

### 4. Custom Domain Setup

1. Under **Custom domain** on the same Pages settings screen:
   - Enter: `www.evanexpharmacy.com`
   - Click **Save**.
   - Check the box **Enforce HTTPS**.
2. **Important**: You must configure your DNS provider (where you bought the domain) to point to GitHub Pages.
   - **CNAME Record**: `www` -> `YOUR_USERNAME.github.io`
   - **A Records** (for naked domain):
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`

Your site should be live in a few minutes!
