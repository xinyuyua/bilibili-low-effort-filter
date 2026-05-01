// ==UserScript==
// @name         Bilibili Low-Effort Video Filter
// @namespace    https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME
// @version      2.2
// @description  Identifies and highlights low-effort/reposted videos on Bilibili using color family analysis and center-weighted cropping.
// @author       YourName
// @match        *://www.bilibili.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bilibili.com
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/main/bilibili-low-effort-filter.user.js
// @updateURL    https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/main/bilibili-low-effort-filter.user.js
// ==/UserScript==

(function() {
    'use strict';

    /**
     * CONFIGURATION
     * Adjust these values to fine-tune the filtering sensitivity.
     */
    const CONFIG = {
        FAMILY_THRESHOLD: 0.80, // 80% of the center must be monochrome to trigger
        BRIGHT_CUTOFF: 200,     // Luminance above this is "Bright Family"
        DARK_CUTOFF: 55,        // Luminance below this is "Dark Family"
        SATURATION_LIMIT: 25,   // Max RGB variance to be considered "Monochrome"
        BORDER_INSET: 0.15,     // Ignore outer 15% of the image (removes colorful borders)
        SAMPLE_RATE: 10,        // Check every 10th pixel for performance
        DEBUG: true             // Set to false to hide console logs
    };

    async function analyzeCenterFamilies(imgElement) {
        return new Promise((resolve) => {
            if (!imgElement || imgElement.naturalWidth === 0) return resolve({ isGarbage: false });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            canvas.width = imgElement.naturalWidth;
            canvas.height = imgElement.naturalHeight;
            
            try {
                ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
                
                const startX = Math.floor(canvas.width * CONFIG.BORDER_INSET);
                const startY = Math.floor(canvas.height * CONFIG.BORDER_INSET);
                const width = Math.floor(canvas.width * (1 - 2 * CONFIG.BORDER_INSET));
                const height = Math.floor(canvas.height * (1 - 2 * CONFIG.BORDER_INSET));

                const data = ctx.getImageData(startX, startY, width, height).data;
                
                let brightFamily = 0;
                let darkFamily = 0;
                let totalPixels = 0;

                for (let i = 0; i < data.length; i += 4 * CONFIG.SAMPLE_RATE) {
                    const r = data[i], g = data[i+1], b = data[i+2];
                    const avg = (r + g + b) / 3;
                    const maxDiff = Math.max(r, g, b) - Math.min(r, g, b);

                    if (maxDiff < CONFIG.SATURATION_LIMIT) {
                        if (avg > CONFIG.BRIGHT_CUTOFF) brightFamily++;
                        else if (avg < CONFIG.DARK_CUTOFF) darkFamily++;
                    }
                    totalPixels++;
                }

                const brightRatio = brightFamily / totalPixels;
                const darkRatio = darkFamily / totalPixels;

                if (brightRatio > CONFIG.FAMILY_THRESHOLD || darkRatio > CONFIG.FAMILY_THRESHOLD) {
                    resolve({ 
                        isGarbage: true, 
                        stats: brightRatio > darkRatio ? `Bright Family: ${(brightRatio*100).toFixed(1)}%` : `Dark Family: ${(darkRatio*100).toFixed(1)}%`
                    });
                }
            } catch (e) { }
            resolve({ isGarbage: false });
        });
    }

    function markAsLowEffort(feed, stats, videoUrl, coverUrl, title) {
        if (CONFIG.DEBUG) {
            console.group(`%c[MARKED] ${title}`, 'color: #ff4757; font-weight: bold;');
            console.log(`Reason: ${stats}\nVideo: ${videoUrl}\nCover: ${coverUrl}`);
            console.groupEnd();
        }

        const cover = feed.querySelector('.bili-video-card__cover');
        if (cover) {
            cover.style.setProperty('background-color', '#ff4d4d', 'important');
            cover.style.setProperty('border', '2px solid #ff0000', 'important');
            const inner = cover.querySelectorAll('img, picture, source');
            inner.forEach(el => el.style.setProperty('opacity', '0.15', 'important'));
        }

        const titleLink = feed.querySelector('.bili-video-card__info--tit');
        if (titleLink && !titleLink.innerText.includes('[⚠️]')) {
            titleLink.style.color = '#ff4d4d';
            titleLink.prepend('[⚠️] ');
        }
    }

    async function processFeed() {
        const cards = document.querySelectorAll('.bili-feed-card:not([data-checked])');
        for (const card of cards) {
            card.setAttribute('data-checked', 'true');
            const img = card.querySelector('.bili-video-card__cover img');
            if (!img || img.dataset.proxySet) continue;

            img.dataset.proxySet = "true";
            const videoUrl = card.querySelector('a[href*="video/"]')?.href || 'N/A';
            const title = card.querySelector('.bili-video-card__info--tit')?.innerText || 'Unknown';
            const coverUrl = img.src;

            const proxyImg = new Image();
            proxyImg.crossOrigin = "anonymous";
            proxyImg.src = coverUrl + (coverUrl.includes('?') ? '&' : '?') + "t=" + Date.now();

            proxyImg.onload = async () => {
                const result = await analyzeCenterFamilies(proxyImg);
                if (result.isGarbage) {
                    markAsLowEffort(card, result.stats, videoUrl, coverUrl, title);
                }
            };
        }
    }

    const observer = new MutationObserver(() => processFeed());
    observer.observe(document.body, { childList: true, subtree: true });
    processFeed();
})();
