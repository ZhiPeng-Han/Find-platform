"""把 site/src 下的源文件合并成一个可发布的 site/index.html。"""
from pathlib import Path

src = Path(__file__).parent / "src"
fonts = ("https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700"
         "&family=Jost:wght@500;600&family=Long+Cang&family=Noto+Sans+SC:wght@400;500;700;900"
         "&family=Noto+Serif+SC:wght@400;600;700&family=Share+Tech+Mono&display=swap")
head = f"""<title>Find 中古相机</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{fonts}">
"""
js = "\n".join((src / f).read_text(encoding="utf-8") for f in ["data.js", "draw.js", "ui.js", "app.js"])
out = (head + "<style>\n" + (src / "style.css").read_text(encoding="utf-8") + "</style>\n"
       + (src / "body.html").read_text(encoding="utf-8") + "<script>\n" + js + "</script>\n")
(Path(__file__).parent / "index.html").write_text(out, encoding="utf-8")
print(f"site/index.html {len(out.encode()) // 1024} KB")
