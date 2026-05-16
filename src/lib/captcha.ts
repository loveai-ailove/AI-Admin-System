// 滑动验证码存储 Map<captchaId, { targetX, expireAt }>
const captchaStore = new Map<
  string,
  { targetX: number; targetY: number; expireAt: number }
>();

// 容差：±5px
const VERIFICATION_TOLERANCE = 5;

// 有效期：2 分钟
const CAPTCHA_EXPIRE_MS = 120_000;

// 拼图块尺寸
const BLOCK_SIZE = 50;

// 拼图块顶部凸起高度
const PROTRUDE_H = 10;

// 验证码画布尺寸
const CANVAS_WIDTH = 310;
const CANVAS_HEIGHT = 160;

// 定时清理过期验证码，每 30 秒执行一次
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [id, data] of captchaStore) {
    if (now > data.expireAt) {
      captchaStore.delete(id);
    }
  }
}, 30_000);

// 进程退出时清理定时器
if (typeof process !== "undefined") {
  process.on("SIGTERM", () => clearInterval(cleanupInterval));
  process.on("SIGINT", () => clearInterval(cleanupInterval));
}

/**
 * 生成随机整数 [min, max)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * 生成拼图块 SVG path（方块主体 + 顶部凸起）
 */
function blockPathD(x: number, y: number, size: number): string {
  const topY = y + PROTRUDE_H;
  const bottomY = topY + size;
  const knobRadius = size * 0.18;
  const knobCenterX = x + size / 2;

  return [
    `M ${x} ${topY}`,
    `L ${knobCenterX - knobRadius} ${topY}`,
    `Q ${knobCenterX - knobRadius * 0.6} ${y} ${knobCenterX} ${y}`,
    `Q ${knobCenterX + knobRadius * 0.6} ${y} ${knobCenterX + knobRadius} ${topY}`,
    `L ${x + size} ${topY}`,
    `L ${x + size} ${bottomY}`,
    `L ${x} ${bottomY}`,
    "Z",
  ].join(" ");
}

/**
 * 生成装饰元素 SVG（随机圆点和线条）
 */
function decorationSVG(width: number, height: number): string {
  let shapes = "";
  for (let i = 0; i < 30; i++) {
    const x = randomInt(0, width);
    const y = randomInt(0, height);
    const r = randomInt(3, 15);
    const opacity = (Math.random() * 0.15 + 0.05).toFixed(2);
    shapes += `<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(255,255,255,${opacity})"/>`;
  }
  for (let i = 0; i < 10; i++) {
    const x1 = randomInt(0, width);
    const y1 = randomInt(0, height);
    const x2 = randomInt(0, width);
    const y2 = randomInt(0, height);
    const opacity = (Math.random() * 0.1 + 0.05).toFixed(2);
    const w = randomInt(1, 3);
    shapes += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,${opacity})" stroke-width="${w}"/>`;
  }
  return shapes;
}

/**
 * SVG 转 base64 data URL
 */
function svgToBase64(svg: string): string {
  // 编码 SVG 为 URI 组件
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

/**
 * 生成滑动验证码
 * 使用纯 SVG 渲染，无 native dependency
 * 答案（targetX）仅保存在服务端，不返回前端
 */
export function generateSlideCaptcha(): {
  captchaId: string;
  blockSize: number;
  blockY: number;
  canvasWidth: number;
  canvasHeight: number;
  backgroundImage: string;
  blockImage: string;
} {
  // 随机缺口位置
  const targetX = randomInt(60, CANVAS_WIDTH - BLOCK_SIZE - 10);
  const targetY = randomInt(10, CANVAS_HEIGHT - BLOCK_SIZE - PROTRUDE_H - 10);

  // 随机渐变色背景
  const hue1 = randomInt(0, 360);
  const hue2 = (hue1 + randomInt(60, 180)) % 360;
  const hue3 = (hue2 + randomInt(30, 90)) % 360;

  const captchaId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  captchaStore.set(captchaId, {
    targetX,
    targetY,
    expireAt: Date.now() + CAPTCHA_EXPIRE_MS,
  });

  // ── 生成背景图 SVG ──
  const bgSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}">
      <defs>
        <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue1},70%,65%)" />
          <stop offset="50%" style="stop-color:hsl(${hue2},70%,60%)" />
          <stop offset="100%" style="stop-color:hsl(${hue3},70%,65%)" />
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="2" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      <!-- 背景 -->
      <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="url(#bg-grad)" />
      <!-- 装饰纹理 -->
      ${decorationSVG(CANVAS_WIDTH, CANVAS_HEIGHT)}
      <!-- 缺口阴影 -->
      <path d="${blockPathD(targetX, targetY, BLOCK_SIZE)}" fill="rgba(0,0,0,0.2)" filter="url(#shadow)"/>
      <!-- 缺口（半透明白色覆盖） -->
      <path d="${blockPathD(targetX, targetY, BLOCK_SIZE)}" fill="rgba(255,255,255,0.85)"/>
      <!-- 缺口描边 -->
      <path d="${blockPathD(targetX, targetY, BLOCK_SIZE)}" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="1"/>
    </svg>
  `;

  // ── 生成拼图块 SVG ──
  const blockCanvasHeight = BLOCK_SIZE + PROTRUDE_H;

  // 拼图块渐变（与背景对应区域相近）
  const blockHue1 = (hue1 + randomInt(0, 10)) % 360;
  const blockHue2 = (hue2 + randomInt(0, 10)) % 360;

  const blockSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${BLOCK_SIZE}" height="${blockCanvasHeight}" viewBox="0 0 ${BLOCK_SIZE} ${blockCanvasHeight}">
      <defs>
        <linearGradient id="blk-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${blockHue1},70%,65%)" />
          <stop offset="100%" style="stop-color:hsl(${blockHue2},70%,60%)" />
        </linearGradient>
        <clipPath id="blk-clip">
          <path d="${blockPathD(0, 0, BLOCK_SIZE)}"/>
        </clipPath>
        <filter id="blk-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.4)"/>
        </filter>
      </defs>
      <!-- 拼图块主体 -->
      <g clip-path="url(#blk-clip)" filter="url(#blk-shadow)">
        <rect x="0" y="0" width="${BLOCK_SIZE}" height="${blockCanvasHeight}" fill="url(#blk-grad)"/>
        <!-- 小块纹理 -->
        ${decorationSVG(BLOCK_SIZE, blockCanvasHeight)}
      </g>
      <!-- 拼图块边缘描边 -->
      <path d="${blockPathD(0, 0, BLOCK_SIZE)}" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="1.5"/>
      <path d="${blockPathD(0, 0, BLOCK_SIZE)}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
    </svg>
  `;

  return {
    captchaId,
    blockSize: BLOCK_SIZE,
    blockY: targetY,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    backgroundImage: svgToBase64(bgSVG),
    blockImage: svgToBase64(blockSVG),
  };
}

/**
 * 验证滑动位移是否正确
 * @returns { success: boolean, reason?: string }
 */
export function verifySlideCaptcha(
  captchaId: string,
  offsetX: number
): { success: boolean; reason?: string } {
  const record = captchaStore.get(captchaId);

  if (!record) {
    return { success: false, reason: "验证码已失效，请刷新后重试" };
  }

  // 检查过期
  if (Date.now() > record.expireAt) {
    captchaStore.delete(captchaId);
    return { success: false, reason: "验证码已过期，请刷新后重试" };
  }

  // 验证位移（一次性使用，验证后立即删除）
  captchaStore.delete(captchaId);

  const diff = Math.abs(offsetX - record.targetX);
  if (diff > VERIFICATION_TOLERANCE) {
    return { success: false, reason: "验证码验证失败，请重试" };
  }

  return { success: true };
}
