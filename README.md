# Cornel.Media - Professional Media Portfolio Website

A modern, responsive portfolio website for showcasing photography, videography, and digital content services.

## Features

- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Modern UI/UX** - Clean, professional design with smooth animations
- **Interactive Portfolio** - Filterable gallery with hover effects
- **Contact Form** - Integrated contact form with email functionality
- **SEO Optimized** - Proper meta tags and semantic HTML structure
- **Fast Loading** - Optimized images and efficient code structure

## Sections

1. **Hero Section** - Eye-catching landing area with call-to-action buttons
2. **Portfolio** - Filterable showcase of work (Photography, Video, Digital)
3. **About** - Professional background and statistics
4. **Services** - Overview of offered services
5. **Contact** - Contact information and inquiry form
6. **Footer** - Site navigation and additional links

## Technologies Used

- HTML5
- CSS3 (Grid, Flexbox, Animations)
- Vanilla JavaScript (ES6+)
- Google Fonts (Inter)

## Setup Instructions for GitHub Pages

Follow these steps to deploy your website on GitHub Pages:

### 1. Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name your repository (e.g., "cornel-media-website")
5. Make sure it's set to "Public"
6. Click "Create repository"

### 2. Upload Your Website Files

**Option A: Using GitHub Web Interface**
1. In your new repository, click "uploading an existing file"
2. Drag and drop all files from your `cornel-media-website` folder
3. Commit the changes with a message like "Initial website upload"

**Option B: Using Git Command Line**
```bash
# Navigate to your website folder
cd C:\Users\corne\cornel-media-website

# Initialize git repository
git init

# Add all files
git add .

# Commit files
git commit -m "Initial website upload"

# Add your GitHub repository as origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# Push to GitHub
git push -u origin main
```

### 3. Enable GitHub Pages

1. In your GitHub repository, go to "Settings"
2. Scroll down to "Pages" in the left sidebar
3. Under "Source", select "Deploy from a branch"
4. Choose "main" branch and "/ (root)" folder
5. Click "Save"

### 4. Configure Custom Domain

1. In the Pages settings, under "Custom domain"
2. Enter your domain: `cornel.media`
3. Click "Save"
4. GitHub will create a CNAME file in your repository

### 5. Update DNS Settings

In your domain registrar's control panel:

1. **Add CNAME Record:**
   - Type: CNAME
   - Name: www
   - Value: YOUR_USERNAME.github.io

2. **Add A Records for apex domain:**
   - Type: A
   - Name: @ (or leave blank)
   - Values (add all four):
     - 185.199.108.153
     - 185.199.109.153
     - 185.199.110.153
     - 185.199.111.153

### 6. Wait for DNS Propagation

- DNS changes can take 24-48 hours to fully propagate
- You can check status at your GitHub repository's Pages settings
- Once ready, your site will be live at `https://cornel.media`

## Customization Guide

### Adding Your Own Images

1. Replace placeholder images in the `images/` folder:
   - `portfolio-1.jpg` through `portfolio-4.jpg` (300x250px recommended)
   - `about-image.jpg` (400x400px recommended)

### Updating Content

- **Contact Information**: Edit lines 169-178 in `index.html`
- **About Section**: Update lines 108-110 in `index.html`
- **Services**: Modify lines 138-157 in `index.html`
- **Stats**: Change numbers in lines 112-123 in `index.html`

### Color Scheme

Main colors used (defined in `css/style.css`):
- Primary: `#6366f1` (purple/blue)
- Secondary: `#1e293b` (dark blue-gray)
- Accent: `#64748b` (light gray)
- Background: `#f8fafc` (very light gray)

### Adding More Portfolio Items

Copy the portfolio item structure and add to the portfolio grid:

```html
<div class="portfolio-item" data-category="CATEGORY_NAME">
    <div class="item-image">
        <img src="images/your-image.jpg" alt="Description" loading="lazy">
        <div class="item-overlay">
            <h3>Project Title</h3>
            <p>Category</p>
        </div>
    </div>
</div>
```

## File Structure

```
cornel-media-website/
├── index.html          # Main website file
├── css/
│   └── style.css       # Styles and responsive design
├── js/
│   └── script.js       # Interactive functionality
├── images/             # Website images (add your own)
└── README.md           # This file
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance

- Lightweight and fast loading
- Optimized for Core Web Vitals
- Mobile-first responsive design
- Lazy loading for images

## License

This project is open source and available under the [MIT License](https://opensource.org/licenses/MIT).

## Support

For questions or issues with the website, please contact hello@cornel.media

---

**Note**: Remember to add your actual portfolio images and update the contact information before going live!