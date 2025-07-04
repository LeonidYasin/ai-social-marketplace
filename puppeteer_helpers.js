// Универсальные Puppeteer-хелперы для поиска и клика по элементам

async function clickVisibleButtonByText(page, text) {
    // 1. Поиск среди всех видимых кнопок и элементов с текстом
    const selectors = [
        'button', '[role="button"]', '.MuiButton-root', '.MuiDialog-root button', '.modal button', '*'
    ];
    for (const selector of selectors) {
        const handles = await page.$$(selector);
        for (const handle of handles) {
            const btnText = await handle.evaluate(el => el.innerText || el.textContent);
            const isVisible = await handle.evaluate(el => {
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
            });
            if (btnText && btnText.trim().toLowerCase().includes(text.toLowerCase()) && isVisible) {
                try {
                    await handle.click();
                    return true;
                } catch {
                    await page.evaluate(el => el.click(), handle);
                    return true;
                }
            }
        }
    }
    return false;
}

async function getVisibleTextBySelector(page, selector) {
    const el = await page.$(selector);
    if (!el) return null;
    const isVisible = await el.evaluate(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    });
    if (!isVisible) return null;
    return await el.evaluate(el => el.innerText || el.textContent);
}

async function getProfileUserName(page) {
    // Открыть профиль, если не открыт
    await clickVisibleButtonByText(page, 'профиль');
    // Найти имя пользователя (например, в h6, h5, span, div)
    const selectors = ['h6', 'h5', 'span', 'div'];
    for (const sel of selectors) {
        const el = await page.$(sel);
        if (el) {
            const text = await el.evaluate(el => el.innerText || el.textContent);
            if (text && text.trim().length > 2 && !text.includes('гость')) {
                return text.trim();
            }
        }
    }
    // fallback: ищем по всему DOM
    const all = await page.$$('*');
    for (const el of all) {
        const text = await el.evaluate(el => el.innerText || el.textContent);
        if (text && text.trim().length > 2 && !text.includes('гость')) {
            return text.trim();
        }
    }
    return null;
}

module.exports = {
    clickVisibleButtonByText,
    getVisibleTextBySelector,
    getProfileUserName
}; 