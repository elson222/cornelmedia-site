# Adding Images and Videos to Your Portfolio

## Required Images for Portfolio

Add these images to the `images/` folder. Recommended size: **400x300px** for best display.

### Wedding Portfolio:
- `wedding-1.jpg` - Royal Wedding Film (main wedding video thumbnail)
- `wedding-2.jpg` - Traditional Ceremony (wedding photography)
- `wedding-3.jpg` - Wedding Details (close-up shots, rings, etc.)

### Event Portfolio:
- `event-1.jpg` - Corporate Gala (professional event)
- `event-2.jpg` - Birthday Celebration (party coverage)

### Drone Portfolio:
- `drone-1.jpg` - Aerial Wedding Shots (drone wedding footage)
- `drone-2.jpg` - Ghana Landscapes (beautiful aerial landscapes)

### Photography Portfolio:
- `portrait-1.jpg` - Couple Portraits (engagement/couple photos)

### About Section:
- `about-image.jpg` - Professional photo of you or your team (400x400px)

## How to Add Images:

### Option 1: Direct Upload
1. Save your images with the exact names above
2. Copy them to the `images/` folder in your website directory
3. Commit and push to GitHub

### Option 2: Using Free Stock Images (Temporary)
For now, you can use free stock images from:
- **Unsplash.com** - Professional quality photos
- **Pexels.com** - Free wedding/event photos
- **Pixabay.com** - Drone/aerial shots

Search terms:
- "Ghana wedding traditional"
- "African wedding ceremony"
- "corporate event ghana"
- "drone aerial wedding"
- "birthday party celebration"
- "couple portrait photography"

## Adding Videos:

### Hero Section Video:
Replace the placeholder in the hero section with an embedded video:

1. **YouTube Embed**: Upload your best wedding/event reel to YouTube, then replace the placeholder with:
```html
<iframe width="500" height="300" src="https://www.youtube.com/embed/YOUR_VIDEO_ID" frameborder="0" allowfullscreen></iframe>
```

2. **Vimeo Embed**: Upload to Vimeo for a more professional look:
```html
<iframe src="https://player.vimeo.com/video/YOUR_VIDEO_ID" width="500" height="300" frameborder="0" allowfullscreen></iframe>
```

### Portfolio Video Thumbnails:
- Use video thumbnails as portfolio images
- When clicked, they can link to full videos on YouTube/Vimeo

## Quick Start with Placeholder Images:

I can help you create temporary placeholder images using online services:

### Using Placeholder Services:
Replace the image sources temporarily with:
```html
<!-- Wedding placeholder -->
<img src="https://picsum.photos/400/300?random=1" alt="Wedding">

<!-- Event placeholder -->
<img src="https://picsum.photos/400/300?random=2" alt="Event">

<!-- Drone placeholder -->
<img src="https://picsum.photos/400/300?random=3" alt="Drone">
```

## Git Commands to Update:
```bash
# After adding your images
git add images/
git commit -m "Add portfolio images and videos"
git push
```

## Professional Tips:

1. **Optimize Images**: Compress images to keep website fast
   - Use tools like TinyPNG.com
   - Keep file sizes under 200KB each

2. **Consistent Style**: Use similar lighting/color grading for cohesive look

3. **High Quality**: Use your best work - this represents your brand

4. **Copyright**: Only use images you own or have permission to use

## Need Help?

If you need help with:
- Image optimization
- Video embedding
- Adding more portfolio items
- Custom layouts

Let me know and I can assist further!