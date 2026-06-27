import os
import json

schema = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "LocalBusiness",
            "name": "Cornel Media Productions",
            "image": "https://cornel.media/assets/images/favicon.png",
            "description": "Ghana's premier creative and digital agency. Premium photography, videography, drone services, and social media management.",
            "url": "https://cornel.media",
            "telephone": "+233500020168",
            "email": "info@cornel.media",
            "address": [
                {
                    "@type": "PostalAddress",
                    "addressLocality": "East Legon, Accra",
                    "addressRegion": "Greater Accra",
                    "addressCountry": "GH"
                },
                {
                    "@type": "PostalAddress",
                    "addressLocality": "Tarkwa",
                    "addressRegion": "Western Region",
                    "addressCountry": "GH"
                }
            ],
            "founder": {
                "@type": "Person",
                "name": "Cornelius Quayson",
                "jobTitle": "Founder & Creative Director",
                "alumniOf": {
                    "@type": "CollegeOrUniversity",
                    "name": "University of Mines and Technology"
                }
            },
            "sameAs": [
                "https://www.tiktok.com/@cornelmedia",
                "https://www.instagram.com/quaysoncornel",
                "https://gh.linkedin.com/in/cornelius-quayson-49a170271"
            ],
            "priceRange": "GH₵"
        },
        {
            "@type": "WebSite",
            "name": "Cornel Media Productions",
            "url": "https://cornel.media"
        }
    ]
}

schema_str = f'\n  <!-- Global JSON-LD -->\n  <script type="application/ld+json">{json.dumps(schema)}</script>\n</head>'

for file in os.listdir('.'):
    if file.endswith('.html'):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Remove old simple schema if exists
        import re
        content = re.sub(r'<script type="application/ld\+json">.*?</script>', '', content, flags=re.DOTALL)
        
        # Inject new comprehensive schema
        if '</head>' in content:
            content = content.replace('</head>', schema_str)
            
            with open(file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Injected JSON-LD to {file}")
