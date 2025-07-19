const char *configForm = R"html(
<!DOCTYPE HTML>
<html>
<head>
  <title>WiFi setup</title>
  <style>
  body {
    background-color: #fcfcfc;
    box-sizing: border-box;
  }
  body, input {
    font-family: Roboto, sans-serif;
    font-weight: 400;
    font-size: 16px;
  }
  .centered {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 20px;
    background-color: #ccc;
    border-radius: 4px;
  }
  td { padding: 0 0 0 5px; }
  label { white-space: nowrap; }
  input { width: 17em; }
  input[name="port"] { width: 5em; }
  input[type="submit"], img { margin: auto; display: block; width: 30%; }
  .error { color: red; font-size: 14px; display: none; }
  .required { color: red; }
  .info { color: #0066cc; font-size: 14px; margin: 10px 0; }
  </style>
  <meta name="viewport" content="width=device-width, user-scalable=0" charset="utf-8">
</head>
<body>
<div class="centered">
  <h3>🔧 Device Configuration</h3>
  <div class="info">
    <strong>Current Device:</strong> <span id="device_name_display">Loading...</span><br>
    <strong>Gateway IP:</strong> <span id="gateway_ip">192.168.4.1</span>
  </div>
  <form method="get" action="configsave" onsubmit="return validateForm()">
    <table>
      <tr>
        <td><label for="device_name">Device Name: <span class="required">*</span></label></td>
        <td><input id="device_name" type="text" name="device_name" length=32 required="required" placeholder="Enter device name"></td>
      </tr>
      <tr>
        <td></td>
        <td><div id="device_name_error" class="error">Device name is required</div></td>
      </tr>
      <tr>
        <td><label for="ssid_sta">WiFi SSID: <span class="required">*</span></label></td>
        <td><input id="ssid_sta" type="text" name="ssid_sta" length=64 required="required" placeholder="Enter WiFi network name"></td>
      </tr>
      <tr>
        <td></td>
        <td>
          <select id="ssid_list" onchange="updatessid_sta()">
            <option value="">Choose a wifi network</option>
          </select>
        </td>
      </tr>
      <tr>
        <td></td>
        <td><div id="ssid_error" class="error">WiFi SSID is required</div></td>
      </tr>
      <tr>
        <td><label for="pass_sta">Password: <span class="required">*</span></label></td>
        <td><input id="pass_sta" type="password" name="pass_sta" length=64 required="required" placeholder="Enter WiFi password"></td>
      </tr>
      <tr>
        <td></td>
        <td><div id="pass_error" class="error">Password is required</div></td>
      </tr>
    </table>
    <br/>
    <input type="submit" value="Save Configuration" id="submit_btn">
  </form>
  <div class="info">
    <strong>Instructions:</strong><br>
    1. Fill in all required fields (*)<br>
    2. Click "Save Configuration"<br>
    3. Device will restart and connect to your WiFi
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
