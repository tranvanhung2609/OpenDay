const char *configForm = R"html(
<!DOCTYPE HTML>
<html>
<head>
  <title>WiFi setup</title>
  <style>
  * {
    box-sizing: border-box;
  }
  
  body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    margin: 0;
    padding: 15px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 16px;
    line-height: 1.5;
    min-height: 100vh;
  }
  
  .container {
    max-width: 100%;
    margin: 0 auto;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    overflow: hidden;
  }
  
  .header {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
    padding: 20px;
    text-align: center;
  }
  
  .header h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .content {
    padding: 20px;
  }
  
  .info-box {
    background: #f8f9fa;
    border-left: 4px solid #007bff;
    padding: 15px;
    margin-bottom: 20px;
    border-radius: 0 8px 8px 0;
  }
  
  .info-box strong {
    color: #495057;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #495057;
  }
  
  .required {
    color: #dc3545;
  }
  
  input[type="text"], 
  input[type="password"],
  select {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.3s ease;
    background: white;
  }
  
  input[type="text"]:focus, 
  input[type="password"]:focus,
  select:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
  }
  
  .error {
    color: #dc3545;
    font-size: 14px;
    margin-top: 5px;
    display: none;
  }
  
  .btn-submit {
    width: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 15px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  
  .btn-submit:hover {
    transform: translateY(-2px);
  }
  
  .btn-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  .instructions {
    background: #e3f2fd;
    border-radius: 8px;
    padding: 15px;
    margin-top: 20px;
  }
  
  .instructions strong {
    color: #1976d2;
  }
  
  .instructions ol {
    margin: 10px 0 0 0;
    padding-left: 20px;
  }
  
  .instructions li {
    margin-bottom: 5px;
  }
  
  @media (max-width: 480px) {
    body {
      padding: 10px;
    }
    
    .header {
      padding: 15px;
    }
    
    .header h3 {
      font-size: 1.3rem;
    }
    
    .content {
      padding: 15px;
    }
    
    input[type="text"], 
    input[type="password"],
    select {
      padding: 10px 14px;
      font-size: 16px; /* Prevent zoom on iOS */
    }
  }
  </style>
  <meta name="viewport" content="width=device-width, user-scalable=0" charset="utf-8">
</head>
<body>
<div class="container">
  <div class="header">
    <h3>🔧 Device Configuration</h3>
  </div>
  
  <div class="content">
    <div class="info-box">
      <strong>Current Device:</strong> <span id="device_name_display">Loading...</span><br>
      <strong>Gateway IP:</strong> <span id="gateway_ip">192.168.4.1</span>
    </div>
    
    <form method="get" action="configsave" onsubmit="return validateForm()">
      <div class="form-group">
        <label for="device_name">Device Name <span class="required">*</span></label>
        <input id="device_name" type="text" name="device_name" maxlength="32" required="required" placeholder="Enter device name">
        <div id="device_name_error" class="error">Device name is required</div>
      </div>
      
      <div class="form-group">
        <label for="ssid_sta">WiFi SSID <span class="required">*</span></label>
        <input id="ssid_sta" type="text" name="ssid_sta" maxlength="64" required="required" placeholder="Enter WiFi network name">
        <div id="ssid_error" class="error">WiFi SSID is required</div>
      </div>
      
      <div class="form-group">
        <label for="ssid_list">Available Networks</label>
        <select id="ssid_list" onchange="updatessid_sta()">
          <option value="">Choose a wifi network</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="pass_sta">Password <span class="required">*</span></label>
        <input id="pass_sta" type="password" name="pass_sta" maxlength="64" required="required" placeholder="Enter WiFi password">
        <div id="pass_error" class="error">Password is required</div>
      </div>
      
      <button type="submit" class="btn-submit" id="submit_btn">Save Configuration</button>
    </form>
    
    <div class="instructions">
      <strong>📋 Instructions:</strong>
      <ol>
        <li>Fill in all required fields marked with <span class="required">*</span></li>
        <li>Click "Save Configuration" button</li>
        <li>Device will restart and connect to your WiFi</li>
      </ol>
    </div>
  </div>
</div>
<script type="text/javascript">
  window.onload = function() {
    getWifiList();
    setupValidation();
    getDeviceInfo();
  }
  
  var xhttp = new XMLHttpRequest();
  function getWifiList() {
    xhttp.onreadystatechange = function() {
      if (xhttp.readyState == 4 && xhttp.status == 200) {
        var obj = JSON.parse(xhttp.responseText);
        var ssidlist = obj;
        var select = document.getElementById("ssid_list");
        for (var i = 0; i < ssidlist.length; ++i) {
          select[select.length] = new Option(ssidlist[i], ssidlist[i]);
        }
      }
    }
    xhttp.open("GET", "/wifiscan.json", true);
    xhttp.send();
  }
  
  function updatessid_sta() {
    document.getElementById("ssid_sta").value = document.getElementById("ssid_list").value;
    validateField('ssid_sta');
  }
  
  function setupValidation() {
    document.getElementById("device_name").addEventListener("input", function() {
      validateField('device_name');
    });
    document.getElementById("ssid_sta").addEventListener("input", function() {
      validateField('ssid_sta');
    });
    document.getElementById("pass_sta").addEventListener("input", function() {
      validateField('pass_sta');
    });
  }
  
  function validateField(fieldName) {
    var field = document.getElementById(fieldName);
    var errorDiv = document.getElementById(fieldName + '_error');
    var value = field.value; // Không trim ngay lập tức để cho phép nhập khoảng trắng
    
    // Chỉ kiểm tra xem có nội dung không (bao gồm cả khoảng trắng)
    var isValid = value.length > 0;
    
    if (isValid) {
      errorDiv.style.display = 'none';
      field.style.borderColor = '';
    } else {
      errorDiv.style.display = 'block';
      field.style.borderColor = 'red';
    }
    
    return isValid;
  }
  
  function validateForm() {
    var deviceNameValid = validateField('device_name');
    var ssidValid = validateField('ssid_sta');
    var passValid = validateField('pass_sta');
    
    if (deviceNameValid && ssidValid && passValid) {
      // Trim và normalize tất cả các trường trước khi submit
      var deviceName = document.getElementById('device_name').value.trim().replace(/\s+/g, ' ');
      var ssid = document.getElementById('ssid_sta').value.trim();
      var pass = document.getElementById('pass_sta').value.trim();
      
      // Chỉ cập nhật lại giá trị nếu có thay đổi sau khi normalize
      if (deviceName !== document.getElementById('device_name').value) {
        document.getElementById('device_name').value = deviceName;
      }
      if (ssid !== document.getElementById('ssid_sta').value) {
        document.getElementById('ssid_sta').value = ssid;
      }
      if (pass !== document.getElementById('pass_sta').value) {
        document.getElementById('pass_sta').value = pass;
      }
      
      document.getElementById("submit_btn").disabled = true;
      document.getElementById("submit_btn").value = "Saving...";
      return true;
    } else {
      alert("Please fill in all required fields marked with *");
      return false;
    }
  }
  
  function getDeviceInfo() {
    // Lấy thông tin thiết bị từ server
    var xhttp2 = new XMLHttpRequest();
    xhttp2.onreadystatechange = function() {
      if (xhttp2.readyState == 4 && xhttp2.status == 200) {
        try {
          var deviceInfo = JSON.parse(xhttp2.responseText);
          document.getElementById("device_name_display").textContent = deviceInfo.device_name || "New Device";
          document.getElementById("gateway_ip").textContent = deviceInfo.gateway_ip || "192.168.4.1";
          
          // Pre-fill device name nếu có
          if (deviceInfo.device_name && deviceInfo.device_name.length > 0) {
            document.getElementById("device_name").value = deviceInfo.device_name;
          }
        } catch (e) {
          document.getElementById("device_name_display").textContent = "New Device";
        }
      }
    }
    xhttp2.open("GET", "/deviceinfo.json", true);
    xhttp2.send();
  }
</script>
</body>
</html>
)html";
