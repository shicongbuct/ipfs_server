//var serverUrl = "http://39.106.106.129:3000";
//var serverUrl = "http://127.0.0.1:3000";
var chunkSize = 5 * 1024 * 1024;

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
		url: "/upload?account=" + account.value,
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
        url: "/file_list?account=" + account.value,
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
			url: '/delete_file?account=' + account.value + '&fileName=' + fileName,
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
            url: '/download_file?account=' + account.value + '&fileName=' + fileName,
            type: 'GET',
            success: function (data) {
                var url = data.url;
                var id = 'file_download' + (+new Date);
                var dom = '<div><a href="' + url + '" id="' + id + '" download="' + data.fileName + '" target="_blank">下载： ' + data.fileName + '</a></div>';
                $("body").append(dom);
                //$("#" + id).click();
            }
        });
	});
}

var uploader = WebUploader.create({
    server: '/chunk_upload',
    pick: '#picker',
    resize: false,
    chunked: true,
    chunkSize: chunkSize,
    chunkRetry: 2
});

// 当有文件被添加进队列的时候
uploader.on( 'fileQueued', function( file ) {
    $list = $("#thelist");
    $list.append( '<div id="' + file.id + '" class="item">' +
        '<h4 class="info">' + file.name + '</h4>' +
        '<p class="state">等待上传...</p>' +
        '</div>' );
});

$("#ctlBtn").click(function (event) {
    var files = uploader.getFiles();
    var account = document.getElementById("account");
    if (!files.length) {
        alert("请先选择上传文件");
        return false
    }
    if (!account.value) {
        alert('请先填写用户名');
        return false;
    }
    files.forEach(function(item) {
        uploader.md5File(item, 0, 1024 * 1024)
                .progress(function(percentage) {console.log("percentage", percentage)})
                .then(function (val) {
                    console.log(item);
                    uploader.option("formData", {"md5": val, "account": account.value});
                    if ($('#'+item.id).find('p.state').text() === "已上传") {
                        return false;
                    } else {
                        item.md5 = val;
                        item.account = account.value;
                        uploader.upload(item);
                    }
                });
    });
});

// 文件上传过程中创建进度条实时显示。
uploader.on( 'uploadProgress', function( file, percentage ) {
    var $li = $( '#'+file.id ),
        $percent = $li.find('.progress .progress-bar');

    // 避免重复创建
    if ( !$percent.length ) {
        $percent = $('<div class="progress progress-striped active">' +
            '<div class="progress-bar" role="progressbar" style="width: 0%">' +
            '</div>' +
            '</div>').appendTo( $li ).find('.progress-bar');
    }

    $li.find('p.state').text('上传中');
    $percent.css( 'width', percentage * 100 + '%' );
});

uploader.on( 'uploadSuccess', function( file ) {
    console.log(file);
    var isSingleChunk = false;
    if (file.size <= chunkSize) isSingleChunk = true;
    $.ajax({
        url : '/merge?md5=' + file.md5 + '&filename=' + file.name + '&account=' + file.account + '&size=' + file.size + '&isSingleChunk=' + isSingleChunk,
        type: "GET",
        success: function(data) {
            $( '#'+file.id ).find('p.state').text('已上传');
        }
    });
});

uploader.on( 'uploadError', function( file ) {
    $( '#'+file.id ).find('p.state').text('上传出错');
});

uploader.on( 'uploadComplete', function( file ) {
    $( '#'+file.id ).find('.progress').fadeOut();
});
