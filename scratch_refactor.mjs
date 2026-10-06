import fs from 'fs';
import path from 'path';

const boardPath = path.resolve('app/components/social-accounts/social-accounts-board.tsx');
const connectPath = path.resolve('app/components/social-accounts/connect-channel-modal.tsx');
const managePath = path.resolve('app/components/social-accounts/manage-access-dialog.tsx');
const disconnectPath = path.resolve('app/components/social-accounts/disconnect-dialog.tsx');
const auditPath = path.resolve('app/components/social-accounts/audit-logs-modal.tsx');

let board = fs.readFileSync(boardPath, 'utf8');
let connect = fs.readFileSync(connectPath, 'utf8');
let manage = fs.readFileSync(managePath, 'utf8');
let disconnect = fs.readFileSync(disconnectPath, 'utf8');

// 1. Types replacements
const typesReplace = (content) => {
  let c = content.replace(/import type \{ SocialAccount, ClientWithAccounts \}/g, 'import type { ClientChannel, ClientWithChannels }');
  c = c.replace(/import type \{ SocialAccount \}/g, 'import type { ClientChannel }');
  c = c.replace(/ClientWithAccounts/g, 'ClientWithChannels');
  c = c.replace(/SocialAccount/g, 'ClientChannel');
  return c;
};

board = typesReplace(board);
connect = typesReplace(connect);
manage = typesReplace(manage);
disconnect = typesReplace(disconnect);

// 2. Query hooks replacements
board = board.replace(/socialQueries\.listClientsWithAccounts/g, 'socialQueries.listClientsWithChannels');
board = board.replace(/useDisconnectAccount/g, 'useDisconnectChannel');
board = board.replace(/useSyncAccount/g, 'useSyncChannel');

// 3. social-data removal
board = board.replace(/import \{ MOCK_CLIENTS \} from ".\/social-data"/g, '');
connect = connect.replace(/import \{ ALL_PLATFORMS \} from ".\/social-data"/g, '');

// Fix connect-channel-modal types and PLATFORM_SCOPES case
connect = connect.replace(/type PlatformId = \(typeof ALL_PLATFORMS\)\[number\]/g, 'type PlatformId = "Instagram" | "TikTok" | "YouTube" | "LinkedIn" | "Twitter" | "Facebook"');
connect = connect.replace(/platform === "Facebook"/g, 'platform === "facebook"');

// Write back
fs.writeFileSync(boardPath, board);
fs.writeFileSync(connectPath, connect);
fs.writeFileSync(managePath, manage);
fs.writeFileSync(disconnectPath, disconnect);

console.log("Refactored references successfully.");
