with open('src/app/page.tsx', 'r') as f:
    text = f.read()

if 'Calculator' not in text.split('from "lucide-react"')[0]:
    text = text.replace('} from "lucide-react"', ', Calculator } from "lucide-react"')
    with open('src/app/page.tsx', 'w') as f:
        f.write(text)
    print("已补充引入 Calculator 图标")
