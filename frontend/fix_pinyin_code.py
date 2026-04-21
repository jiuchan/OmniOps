with open('src/app/page.tsx', 'r') as f:
    text = f.read()

target = """    if (char.localeCompare('阿', 'zh-CN') < 0) return char.toUpperCase();
    if (char.localeCompare('帀', 'zh-CN') > 0) return char.toUpperCase();
    for (let i = 0; i < zh.length; i++) {
        if (char.localeCompare(zh[i], 'zh-CN') < 0) return letters[i - 1] || char.toUpperCase();
    }
    return 'Z';
};

const getCodeForName = (str: string) => {
    if (!str) return "";
    return str.split('').map(c => getFirstLetter(c)).join('');
};"""

replace = """    if (!/[\\u4e00-\\u9fa5]/.test(char)) return char.toUpperCase(); // 非汉字直接大写
    if (char.localeCompare('阿', 'zh-CN') < 0) return ''; // 越界不可识别汉字
    if (char.localeCompare('帀', 'zh-CN') >= 0) return 'Z';
    for (let i = 0; i < zh.length; i++) {
        if (char.localeCompare(zh[i], 'zh-CN') < 0) return letters[i - 1] || 'A';
    }
    return 'Z';
};

const getCodeForName = (str: string) => {
    if (!str) return "";
    return str.split('').map(c => getFirstLetter(c)).join('').replace(/[^A-Z0-9]/g, '');
};"""

if target in text:
    text = text.replace(target, replace)
    with open('src/app/page.tsx', 'w') as f:
        f.write(text)
    print("拼音缩写生成逻辑已修复")
else:
    print("未能匹配到目标字符串，请检查目标")
