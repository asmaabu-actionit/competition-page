/**
 * Competition Sign-Up – Apps Script (copy into Extensions > Apps Script and redeploy)
 *
 * SHEET LAYOUT (must match exactly):
 * A: Email | B: Total Entries | C: Referred By | D: Successful Referrals | E: Timestamp
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createResponse(false, 'Invalid request');
    }
    var data = JSON.parse(e.postData.contents);
    if (data.action === 'signup') {
      return handleSignup(data.email, data.referrer);
    }
    return createResponse(false, 'Invalid action');
  } catch (err) {
    Logger.log('Error: ' + err.toString());
    return createResponse(false, 'Server error. Please try again.');
  }
}

function handleSignup(email, referrerEmail) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return createResponse(false, 'Please enter a valid email address');
  }
  email = String(email).toLowerCase().trim();

  var data = sheet.getDataRange().getValues();
  var numRows = data.length;

  for (var i = 1; i < numRows; i++) {
    var rowEmail = data[i][0];
    if (rowEmail && String(rowEmail).toLowerCase() === email) {
      return createResponse(false, 'This email is already registered');
    }
  }

  var entries = 1;
  var referredBy = '';

  if (referrerEmail && String(referrerEmail).trim() !== '') {
    referrerEmail = String(referrerEmail).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(referrerEmail)) {
      return createResponse(false, 'Please enter a valid referrer email address');
    }
    if (referrerEmail === email) {
      return createResponse(false, 'You cannot refer yourself');
    }

    var referrerFound = false;
    for (var j = 1; j < numRows; j++) {
      var rowEmail = data[j][0];
      if (rowEmail && String(rowEmail).toLowerCase() === referrerEmail) {
        referrerFound = true;
        referredBy = referrerEmail;
        var currentEntries = typeof data[j][1] === 'number' ? data[j][1] : 1;
        var currentReferrals = typeof data[j][3] === 'number' ? data[j][3] : 0;
        sheet.getRange(j + 1, 2).setValue(currentEntries + 1);
        sheet.getRange(j + 1, 4).setValue(currentReferrals + 1);
        break;
      }
    }
    if (!referrerFound) {
      return createResponse(false, 'Referrer email not found. They must sign up first.');
    }
  }

  // Use formatted string for timestamp so Sheets never treats it as epoch
  var now = new Date();
  var timestampStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

  // Append in exact order: A=Email, B=Total Entries, C=Referred By, D=Successful Referrals, E=Timestamp
  sheet.appendRow([
    email,           // A
    entries,         // B (number)
    referredBy,      // C
    0,               // D (number)
    timestampStr     // E (text)
  ]);

  return createResponse(true,
    referredBy ? 'Successfully registered! You and your referrer both received an entry.' : 'Successfully registered!',
    { entries: entries }
  );
}

function createResponse(success, message, additionalData) {
  var response = { success: success, message: message };
  if (additionalData && typeof additionalData === 'object') {
    for (var key in additionalData) {
      if (additionalData.hasOwnProperty(key)) {
        response[key] = additionalData[key];
      }
    }
  }
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.clear();
  sheet.appendRow(['Email', 'Total Entries', 'Referred By', 'Successful Referrals', 'Timestamp']);
  sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#667eea').setFontColor('#ffffff');
  sheet.setColumnWidth(1, 250);
  sheet.setColumnWidth(2, 120);
  sheet.setColumnWidth(3, 250);
  sheet.setColumnWidth(4, 180);
  sheet.setColumnWidth(5, 180);
}
