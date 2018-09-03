//var serverUrl = "http://39.106.106.129:3000";
var serverUrl = "http://127.0.0.1:3000";

var upload_btn = document.getElementById("upload_btn");
upload_btn.addEventListener('click', function() {
	var account = document.getElementById("account");
	if (!account.value) {
		alert('请先填写用户名');
		return false;
	}
	var uploaupload_file_input = document.getElementById("upload_file_input");
	var file = uploaupload_file_input.files[0];
	if (!file) {
		alert('请先选择上传文件');
		return false;
	}
	var form = new FormData();
	form.append('upload_file', file);
	$.ajax({
		url: serverUrl + "/upload?account=" + account.value,
		type: 'POST',
		data: form,
		contentType: false,
		processData: false,
		success: function (data) {
			console.log(data);
			if (data === "already exist") {
			    alert("文件已存在");
            } else if (data === "failed") {
			    alert("文件上传失败");
            } else if (data === "ok") {
			    alert("文件上传成功");
            } else {
			    alert("未知错误");
            }
		}
	});
});

var file_list = document.getElementById("file_list");
file_list.addEventListener('click', function () {
    var account = document.getElementById("account");
    if (!account.value) {
        alert('请先填写用户名');
        return false;
    }
    $.ajax({
        url: serverUrl + "/file_list?account=" + account.value,
        type: 'GET',
        success: function (data) {
        	if (!data.data) return false;
        	$("table.file_list_result").empty();
			data.data.forEach(function (item, index) {
                var fileSize = formatFileSize(item.fileSize);
				var dom = '<tr><td class="fileName">' + item.fileName + '</td><td>' + fileSize + '</td><td class="download">生成下载链接</td><td class="del">删除</td></tr>';
                $('table.file_list_result').append(dom);
            });
			bind_delete_event();
			bind_download_event();
        }
    });
});

function formatFileSize(originFileSize) {
    var fileSize = '';
    if (originFileSize < 1024) {
        fileSize = originFileSize + 'B';
    } else if (originFileSize < 1024 * 1024) {
        fileSize = (originFileSize / 1024).toFixed(2) + 'K';
    } else if (originFileSize < 1024 * 1024 * 1024) {
        fileSize = (originFileSize / (1024 * 1024)).toFixed(2) + 'M';
    } else {
    	fileSize = originFileSize;
	}
    return fileSize
}

function bind_delete_event() {
	$('table.file_list_result').find('.del').on("click", function() {
	    var that = $(this);
        var account = document.getElementById("account");
        if (!account.value) {
            alert('请先填写用户名');
            return false;
        }
        var fileName = $(this).siblings('td.fileName').text();
		$.ajax({
			url: serverUrl + '/delete_file?account=' + account.value + '&fileName=' + fileName,
			type: 'GET',
			success: function (data) {
				if (data === "ok") {
				    alert("删除成功");
				    that.closest("tr").remove();
                } else if (data === "failed") {
				    alert("删除失败");
                } else {
				    alert("未知错误");
                }
            }
		});
	})
}

function bind_download_event() {
    $('table.file_list_result').find('.download').on('click', function() {
        var account = document.getElementById("account");
        if (!account.value) {
            alert('请先填写用户名');
            return false;
        }
        var fileName = $(this).siblings('td.fileName').text();
        $.ajax({
            url: serverUrl + '/download_file?account=' + account.value + '&fileName=' + fileName,
            type: 'GET',
            success: function (data) {
                var url = serverUrl + data.url;
                var id = 'file_download' + (+new Date);
                var dom = '<div><a href="' + url + '" id="' + id + '" download="' + data.fileName + '" target="_blank">下载： ' + data.fileName + '</a></div>';
                $("body").append(dom);
                //$("#" + id).click();
            }
        });
	});
}
