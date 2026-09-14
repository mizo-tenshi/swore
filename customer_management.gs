// ============================================================
// SWORE 顧客管理システム
// ============================================================

var SHEET = {
  SQUARE_ORDERS:       'Square｜注文',
  APPAREL_CUSTOMER:    'アパレル｜顧客リスト',
  APPAREL_WAITING:     'アパレル｜ウェイティング',
  REALESTATE_CUSTOMER: '不動産｜顧客リスト',
  REALESTATE_WAITING:  '不動産｜ウェイティング',
  STAFFING_CUSTOMER:   '人材業｜顧客リスト',
  STAFFING_WAITING:    '人材業｜ウェイティング',
  EMAIL_LOG:           'メール送信ログ',
  EMAIL_SETTINGS:      'メール設定'
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('SWORE 配信管理')
    .addItem('一斉配信（アパレル顧客リスト）', 'sendBulkEmail')
    .addSeparator()
    .addItem('シート初期設定（初回のみ）', 'setupSheets')
    .addToUi();
}

function onEdit(e) {
  var sheet = e.range.getSheet();
  if (sheet.getName() !== SHEET.APPAREL_WAITING) return;

  var row = e.range.getRow();
  if (row <= 1) return;

  if (e.range.getColumn() === 3) {
    var name       = sheet.getRange(row, 2).getValue();
    var email      = sheet.getRange(row, 3).getValue();
    var alreadySent = sheet.getRange(row, 7).getValue();

    if (name && email && !alreadySent) {
      if (!sheet.getRange(row, 5).getValue()) {
        sheet.getRange(row, 5).setValue(new Date());
      }
      if (!sheet.getRange(row, 6).getValue()) {
        sheet.getRange(row, 6).setValue('待機中');
      }
      sendWaitingRegistrationEmail(name, email, row, sheet);
    }
  }
}

function sendWaitingRegistrationEmail(name, email, row, sheet) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settings = ss.getSheetByName(SHEET.EMAIL_SETTINGS);

  var subject = settings.getRange('B2').getValue();
  var body    = settings.getRange('B3').getValue();
  body = body.replace(/\{\{お名前\}\}/g, name);

  try {
    GmailApp.sendEmail(email, subject, body);
    sheet.getRange(row, 7).setValue('送信済');
    logEmail(name, email, subject, '登録時自動送信', '成功');
  } catch (err) {
    sheet.getRange(row, 7).setValue('送信失敗');
    logEmail(name, email, subject, '登録時自動送信', '失敗: ' + err.message);
  }
}

// ============================================================
// フォーム送信時の自動処理（メール送信 + ウェイティングシートに記録）
// ============================================================
function onFormSubmit(e) {
  var values = e.namedValues;

  var name    = values['お名前']    ? values['お名前'][0]    : '';
  var email   = values['メールアドレス'] ? values['メールアドレス'][0] : '';
  var phone   = values['電話番号']  ? values['電話番号'][0]  : '';
  var zip     = values['郵便番号']  ? values['郵便番号'][0]  : '';
  var address = values['住所']      ? values['住所'][0]      : '';
  var product = values['商品の詳細（例）シャツ・グレー・L・2着'] ? values['商品の詳細（例）シャツ・グレー・L・2着'][0] : '';

  if (!name || !email) return;

  // ウェイティングシートに追記
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var waitingSheet = ss.getSheetByName(SHEET.APPAREL_WAITING);
  var lastRow = waitingSheet.getLastRow() + 1;
  var num = lastRow - 1;

  waitingSheet.getRange(lastRow, 1).setValue(num);
  waitingSheet.getRange(lastRow, 2).setValue(name);
  waitingSheet.getRange(lastRow, 3).setValue(email);
  waitingSheet.getRange(lastRow, 4).setValue(phone);
  waitingSheet.getRange(lastRow, 5).setValue(new Date());
  waitingSheet.getRange(lastRow, 6).setValue('待機中');
  waitingSheet.getRange(lastRow, 7).setValue('');
  // 追加情報（郵便番号・住所・商品詳細）はメモ欄に結合して保存
  // ウェイティングシートのH列以降に拡張する場合はここを変更
  waitingSheet.getRange(lastRow, 8).setValue(zip + ' ' + address);
  waitingSheet.getRange(lastRow, 9).setValue(product);

  // 自動メール送信
  var settings = ss.getSheetByName(SHEET.EMAIL_SETTINGS);
  var subject  = settings.getRange('B2').getValue();
  var body     = settings.getRange('B3').getValue();
  body = body.replace(/\{\{お名前\}\}/g, name);

  try {
    GmailApp.sendEmail(email, subject, body);
    waitingSheet.getRange(lastRow, 7).setValue('送信済');
    logEmail(name, email, subject, 'フォーム登録', '成功');
  } catch (err) {
    waitingSheet.getRange(lastRow, 7).setValue('送信失敗');
    logEmail(name, email, subject, 'フォーム登録', '失敗: ' + err.message);
  }
}

function sendBulkEmail() {
  var ss        = SpreadsheetApp.getActiveSpreadsheet();
  var ui        = SpreadsheetApp.getUi();
  var customers = ss.getSheetByName(SHEET.APPAREL_CUSTOMER);
  var settings  = ss.getSheetByName(SHEET.EMAIL_SETTINGS);

  var subject      = settings.getRange('B5').getValue();
  var bodyTemplate = settings.getRange('B6').getValue();

  if (!subject || !bodyTemplate) {
    ui.alert('メール設定シートに【一斉配信】の件名と本文を入力してください。');
    return;
  }

  var confirmed = ui.alert(
    '一斉配信の確認',
    '配信対象（○）の全顧客へ送信します。よろしいですか？',
    ui.ButtonSet.YES_NO
  );
  if (confirmed !== ui.Button.YES) return;

  var lastRow = customers.getLastRow();
  var success = 0;
  var fail    = 0;

  for (var i = 2; i <= lastRow; i++) {
    var name   = customers.getRange(i, 2).getValue();
    var email  = customers.getRange(i, 3).getValue();
    var target = customers.getRange(i, 6).getValue();

    if (!email || target !== '○') continue;

    var body = bodyTemplate.replace(/\{\{お名前\}\}/g, name);

    try {
      GmailApp.sendEmail(email, subject, body);
      logEmail(name, email, subject, '一斉配信', '成功');
      success++;
      Utilities.sleep(300);
    } catch (err) {
      logEmail(name, email, subject, '一斉配信', '失敗: ' + err.message);
      fail++;
    }
  }

  ui.alert('配信完了\n成功: ' + success + '件\n失敗: ' + fail + '件');
}

function logEmail(name, email, subject, type, result) {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var log = ss.getSheetByName(SHEET.EMAIL_LOG);
  log.appendRow([new Date(), name, email, subject, type, result]);
}

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var sheetDefs = [
    {
      name: SHEET.APPAREL_CUSTOMER,
      headers: ['顧客ID', 'お名前', 'メールアドレス', '電話番号', '登録日', '配信対象（○/×）', 'メモ'],
      color: '#1a1a1a'
    },
    {
      name: SHEET.APPAREL_WAITING,
      headers: ['番号', 'お名前', 'メールアドレス', '電話番号', '登録日時', 'ステータス', 'メール送信済'],
      color: '#1a1a1a'
    },
    {
      name: SHEET.REALESTATE_CUSTOMER,
      headers: ['顧客ID', 'お名前', 'メールアドレス', '電話番号', '登録日', '担当者', 'メモ'],
      color: '#2c3e50'
    },
    {
      name: SHEET.REALESTATE_WAITING,
      headers: ['番号', 'お名前', 'メールアドレス', '電話番号', '登録日時', '希望エリア・物件', 'ステータス'],
      color: '#2c3e50'
    },
    {
      name: SHEET.STAFFING_CUSTOMER,
      headers: ['顧客ID', 'お名前', 'メールアドレス', '電話番号', '登録日', '職種', 'メモ'],
      color: '#4a235a'
    },
    {
      name: SHEET.STAFFING_WAITING,
      headers: ['番号', 'お名前', 'メールアドレス', '電話番号', '登録日時', '希望職種', 'ステータス'],
      color: '#4a235a'
    },
    {
      name: SHEET.EMAIL_LOG,
      headers: ['送信日時', '宛先氏名', '宛先メールアドレス', '件名', '種別', '結果'],
      color: '#555555'
    }
  ];

  for (var i = 0; i < sheetDefs.length; i++) {
    var def = sheetDefs[i];
    var sheet = ss.getSheetByName(def.name);
    if (!sheet) sheet = ss.insertSheet(def.name);
    var headerRange = sheet.getRange(1, 1, 1, def.headers.length);
    headerRange.setValues([def.headers]);
    headerRange.setBackground(def.color).setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(3, 200);
  }

  var settingsSheet = ss.getSheetByName(SHEET.EMAIL_SETTINGS);
  if (!settingsSheet) settingsSheet = ss.insertSheet(SHEET.EMAIL_SETTINGS);

  settingsSheet.getRange('A1').setValue('項目').setFontWeight('bold');
  settingsSheet.getRange('B1').setValue('内容').setFontWeight('bold');
  settingsSheet.getRange('A1:B1').setBackground('#1a1a1a').setFontColor('#ffffff');

  settingsSheet.getRange('A2').setValue('【登録時メール】件名');
  settingsSheet.getRange('B2').setValue('ウェイティングリストへのご登録、誠にありがとうございます｜SWORE');

  settingsSheet.getRange('A3').setValue('【登録時メール】本文');
  settingsSheet.getRange('B3').setValue(defaultWaitingEmailBody());
  settingsSheet.getRange('B3').setWrap(true);

  settingsSheet.getRange('A5').setValue('【一斉配信】件名');
  settingsSheet.getRange('B5').setValue('SWOREよりお知らせ');

  settingsSheet.getRange('A6').setValue('【一斉配信】本文');
  settingsSheet.getRange('B6').setValue('{{お名前}}様\n\nいつもSWOREをご愛顧いただきありがとうございます。\n\n\nSWORE\nhttps://swore.jp');
  settingsSheet.getRange('B6').setWrap(true);

  settingsSheet.setColumnWidth(1, 180);
  settingsSheet.setColumnWidth(2, 500);

  SpreadsheetApp.getUi().alert('初期設定が完了しました。\n\n次のステップ:\nApps Script のトリガー設定で\nonEdit を「編集時」に設定してください。');
}

// ============================================================
// Square API 連携 — 初回のみ実行して認証情報を保存
// ============================================================
function setupSquareCredentials() {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('SQUARE_ACCESS_TOKEN', 'EAAAl9FPCOA29gZIbkbKETUvvZi69518SMA352wZAKGH-1SJM_EEvzp1xzvnolrr');
  props.setProperty('SQUARE_LOCATION_ID', 'LW6GKGMT4T742');
  Logger.log('Square認証情報を保存しました。');
}

// ============================================================
// Square 注文データ取得（毎時トリガーで自動実行）
// ============================================================
function fetchSquareOrders() {
  var props   = PropertiesService.getScriptProperties();
  var token   = props.getProperty('SQUARE_ACCESS_TOKEN');
  var locId   = props.getProperty('SQUARE_LOCATION_ID');
  var lastSync = props.getProperty('SQUARE_LAST_SYNC');

  if (!token || !locId) {
    Logger.log('Square認証情報が未設定です。setupSquareCredentials()を実行してください。');
    return;
  }

  // 前回同期日時がなければ30日前から取得
  if (!lastSync) {
    var d = new Date();
    d.setDate(d.getDate() - 30);
    lastSync = d.toISOString();
  }

  var payload = JSON.stringify({
    location_ids: [locId],
    query: {
      filter: {
        date_time_filter: { created_at: { start_at: lastSync } },
        state_filter: { states: ['COMPLETED'] }
      }
    },
    limit: 500
  });

  var response = UrlFetchApp.fetch('https://connect.squareup.com/v2/orders/search', {
    method: 'POST',
    headers: {
      'Square-Version': '2024-01-18',
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    payload: payload,
    muteHttpExceptions: true
  });

  var data = JSON.parse(response.getContentText());

  if (data.errors) {
    Logger.log('Square APIエラー: ' + JSON.stringify(data.errors));
    return;
  }

  var orders = data.orders || [];
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var sheet  = ss.getSheetByName(SHEET.SQUARE_ORDERS);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET.SQUARE_ORDERS);
    var headers = ['注文ID', '注文日時', '顧客名', 'メールアドレス', '電話番号', '住所', '商品名', '金額（円）', 'ステータス'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground('#1a1a1a').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(2, 160);
    sheet.setColumnWidth(3, 120);
    sheet.setColumnWidth(4, 200);
  }

  // 重複チェック用に既存の注文IDを取得
  var existingIds = [];
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    existingIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(function(r) { return r[0]; });
  }

  var newRows = [];

  orders.forEach(function(order) {
    if (existingIds.indexOf(order.id) !== -1) return;

    var name = '', email = '', phone = '', address = '';
    if (order.fulfillments && order.fulfillments[0]) {
      var details = order.fulfillments[0].shipment_details;
      if (details && details.recipient) {
        var r = details.recipient;
        name    = r.display_name    || '';
        email   = r.email_address   || '';
        phone   = r.phone_number    || '';
        if (r.address) {
          address = [r.address.address_line_1, r.address.locality, r.address.administrative_district_level_1].filter(Boolean).join(' ');
        }
      }
    }

    var items = '';
    if (order.line_items) {
      items = order.line_items.map(function(i) {
        return i.name + (i.quantity !== '1' ? ' x' + i.quantity : '');
      }).join(', ');
    }

    var total = order.total_money ? order.total_money.amount : '';

    newRows.push([order.id, order.created_at, name, email, phone, address, items, total, order.state]);
  });

  if (newRows.length > 0) {
    sheet.getRange(lastRow + 1, 1, newRows.length, 9).setValues(newRows);
  }

  props.setProperty('SQUARE_LAST_SYNC', new Date().toISOString());
  Logger.log('Square: ' + newRows.length + '件の新規注文を取得しました。');
}

function defaultWaitingEmailBody() {
  var body = '{{お名前}}様\n\n';
  body += 'この度は、ウェイティングリストにご登録いただきまして、誠にありがとうございます。\n\n';
  body += 'お名前を拝見し、心より嬉しく思っております。\n';
  body += 'いただいたご縁を大切に、ひとつひとつ丁寧に、想いを込めてお仕立てさせていただきます。\n\n';
  body += '製作はご登録順に進めてまいりますが、決して急ぐことなく、手を抜くことなく。\n';
  body += 'お客様のお手元に届いたとき、その温もりが伝わりますようにと願いながら、真摯に向き合ってまいります。\n\n';
  body += '完成の折には、発送のご案内を改めてお送りいたします。\n';
  body += '今しばらくのお時間をいただけますと幸いです。\n\n';
  body += '引き続き、どうぞよろしくお願い申し上げます。\n\n';
  body += '━━━━━━━━━━━━━━━━\n';
  body += 'SWORE\n';
  body += 'https://swore.jp\n';
  body += '━━━━━━━━━━━━━━━━';
  return body;
}
