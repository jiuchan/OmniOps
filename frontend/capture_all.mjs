import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
  console.log('启动无头浏览器...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  const targetDir = path.join(process.cwd(), '../docs/assets');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const tabs = [
    { id: 'dash', title: '系统总览' },
    { id: 'topology', title: '全域架构拓扑' },
    { id: 'infra', title: '机房机柜视图' },
    { id: 'vips', title: 'VIP调度器列表' },
    { id: 'servers', title: 'RS物理服务器' },
    { id: 'nginx_clusters', title: '七层网关集群' },
    { id: 'ansible_console', title: 'Ansible指令终端' }
  ];

  console.log('正在访问本地服务 http://localhost:3010...');
  await page.goto('http://localhost:3010');
  
  // 模拟登录
  try {
    console.log('尝试执行自动登录...');
    // 等待登录按钮出现
    const loginBtn = await page.waitForSelector('button[type="submit"]', { timeout: 3000 });
    if (loginBtn) {
      // 默认已填 admin / password123，直接点击
      await loginBtn.click();
      await page.waitForTimeout(3000); // 等待系统数据加载和进入大盘
      console.log('✓ 登录成功！');
    }
  } catch (err) {
    console.log('未检测到登录屏或登录失败，尝试直接抓取（可能是开发模式无需认证）。');
  }

  for (const tab of tabs) {
    console.log(`准备截取页面: ${tab.title} (${tab.id})`);
    try {
      await page.goto(`http://localhost:3010/#${tab.id}`, { waitUntil: 'networkidle' });
      // 留出时间渲染动态拓扑或者读取接口
      await page.waitForTimeout(2000);
      
      const filePath = path.join(targetDir, `tab_${tab.id}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`✓ 截图已保存至 ${filePath}`);
    } catch (err) {
      console.error(`✗ 无法截取页面 ${tab.id}:`, err.message);
    }
  }

  await browser.close();
  console.log('全量截图任务完成！');
})();
