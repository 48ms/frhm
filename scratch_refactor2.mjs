import fs from 'fs';
import path from 'path';

const boardPath = path.resolve('app/components/social-accounts/social-accounts-board.tsx');
const managePath = path.resolve('app/components/social-accounts/manage-access-dialog.tsx');

let board = fs.readFileSync(boardPath, 'utf8');
let manage = fs.readFileSync(managePath, 'utf8');

// Fix .accounts -> .channels
board = board.replace(/\.accounts/g, '.channels');

// Fix status checks
board = board.replace(/a\.status === 'SYNCED' \|\| a\.status === 'LIVE_SYNC' \|\| a\.status === 'ACTIVE'/g, 'a.status === "terhubung"');
board = board.replace(/a\.status === 'TOKEN_EXPIRING'/g, 'a.status === "gagal"');
board = board.replace(/a\.status === 'ACTION_NEEDED' \|\| a\.status === 'FAILED'/g, 'a.status === "gagal"');
board = board.replace(/a\.status === "TOKEN_EXPIRING" \|\| a\.status === "ACTION_NEEDED" \|\| a\.status === "FAILED"/g, 'a.status === "gagal"');
board = board.replace(/a\.status === "SYNCED" \|\| a\.status === "LIVE_SYNC"/g, 'a.status === "terhubung"');

// Fix statusBadge function
board = board.replace(/case "SYNCED":/g, 'case "terhubung":');
board = board.replace(/return \{ label: "Connected & Verified", className: "bg-primary text-primary-foreground", dot: "bg-primary animate-pulse" \}\n    case "LIVE_SYNC":\n      return \{ label: "Live Data Feed", className: "bg-primary text-primary-foreground", dot: "bg-primary animate-ping" \}/g, 'return { label: "Connected", className: "bg-primary text-primary-foreground", dot: "bg-primary animate-pulse" }');
board = board.replace(/case "TOKEN_EXPIRING":/g, '');
board = board.replace(/return \{ label: "Token Refresh Needed", className: "bg-amber-500 text-white", dot: "" \}\n    case "ACTION_NEEDED":\n      return \{ label: "Action Required", className: "bg-amber-500 text-white", dot: "" \}\n    case "FAILED":/g, 'case "gagal":');

// Fix platform UI mapping
const platformUIMap = 
const getPlatformUI = (platform: string) => {
  const p = platform.toLowerCase();
  if (p === 'instagram') return { icon: 'instagram', bg: 'bg-pink-500', fg: 'text-pink-500' };
  if (p === 'tiktok') return { icon: 'tiktok', bg: 'bg-black', fg: 'text-black' };
  if (p === 'youtube') return { icon: 'youtube', bg: 'bg-red-500', fg: 'text-red-500' };
  if (p === 'linkedin') return { icon: 'linkedin', bg: 'bg-blue-600', fg: 'text-blue-600' };
  if (p === 'twitter' || p === 'x') return { icon: 'twitter', bg: 'bg-sky-500', fg: 'text-sky-500' };
  if (p === 'facebook') return { icon: 'facebook', bg: 'bg-blue-600', fg: 'text-blue-600' };
  return { icon: 'hub', bg: 'bg-gray-500', fg: 'text-gray-500' };
};
;

board = board.replace(/export function SocialAccountsBoard/, platformUIMap + '\nexport function SocialAccountsBoard');
manage = manage.replace(/export function ManageAccessDialog/, platformUIMap + '\nexport function ManageAccessDialog');

// Fix references to a.bg, a.fg, a.icon, a.name, a.fans, a.growth in board
board = board.replace(/a\.bg/g, 'getPlatformUI(a.platform).bg');
board = board.replace(/a\.fg/g, 'getPlatformUI(a.platform).fg');
board = board.replace(/a\.icon/g, 'getPlatformUI(a.platform).icon');
board = board.replace(/a\.name/g, 'a.handle');
board = board.replace(/a\.fans/g, '"0"');
board = board.replace(/a\.growth/g, '"0%"');
board = board.replace(/a\.token_expiry/g, 'null');
board = board.replace(/a\.bandwidth/g, 'null');
board = board.replace(/a\.metrics/g, 'null');

// Fix handle null
board = board.replace(/pendingDisconnect\.handle/g, '(pendingDisconnect.handle || "")');
board = board.replace(/a\.handle/g, '(a.handle || "Unknown")');

// Fix manage-access-dialog
manage = manage.replace(/account\.scopes/g, '[]');
manage = manage.replace(/account\.bg/g, 'getPlatformUI(account.platform).bg');
manage = manage.replace(/account\.fg/g, 'getPlatformUI(account.platform).fg');
manage = manage.replace(/account\.icon/g, 'getPlatformUI(account.platform).icon');
manage = manage.replace(/account\.name/g, '(account.handle || "Unknown")');

// Fix ClientWithChannels properties
board = board.replace(/c\.short_name/g, 'c.name');

fs.writeFileSync(boardPath, board);
fs.writeFileSync(managePath, manage);
console.log("Fixed main properties.");
