# Erzeugt App-Icon (1024, ohne Alpha) und Startbild (2732) aus resources/*.svg
# Aufruf: python3 scripts/make-assets.py   (braucht playwright + Pillow)
import base64, io, os
from PIL import Image
from playwright.sync_api import sync_playwright
R = os.path.join(os.path.dirname(__file__), '..')
def render(svg_path, size, bg='transparent', inner=None):
    b64 = base64.b64encode(open(svg_path,'rb').read()).decode()
    inner = inner or size
    html = f'<html><body style="margin:0;background:{bg};width:{size}px;height:{size}px;display:flex;align-items:center;justify-content:center"><img src="data:image/svg+xml;base64,{b64}" width="{inner}" height="{inner}"></body></html>'
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width':size,'height':size}); pg.set_content(html); pg.wait_for_timeout(150)
        png = pg.screenshot(omit_background=(bg == 'transparent')); b.close()
    return Image.open(io.BytesIO(png))
icon = render(os.path.join(R,'resources','icon.svg'), 1024, '#3EE07F').convert('RGB')
icon.save(os.path.join(R,'ios','App','App','Assets.xcassets','AppIcon.appiconset','AppIcon-512@2x.png'))
icon.save(os.path.join(R,'resources','icon-1024.png'))
splash = render(os.path.join(R,'resources','icon-rounded.svg'), 2732, '#000000', 400).convert('RGB')
d = os.path.join(R,'ios','App','App','Assets.xcassets','Splash.imageset')
for f in ['splash-2732x2732.png','splash-2732x2732-1.png','splash-2732x2732-2.png']: splash.save(os.path.join(d,f), optimize=True)
print('icon', icon.size, icon.mode, '| splash', splash.size)
