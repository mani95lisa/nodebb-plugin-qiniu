<h1>Qiniu</h1>


<form class="form">
	<div class="row">
		<div class="col-sm-4 col-xs-12">
			<div class="form-group">
				<label>AccessKey</label>
				<input id="AccessKey" type="text" class="form-control" placeholder="Enter Qiniu AccessKey" value="{AccessKey}">
			</div>
		</div>
		<div class="col-sm-4 col-xs-12">
			<div class="form-group">
				<label>SecretKey</label>
				<input id="SecretKey" type="text" class="form-control" placeholder="Enter Qiniu SecretKey" value="{SecretKey}">
			</div>
		</div>
		<div class="col-sm-2 col-xs-12">
			<div class="form-group">
				<label>Bucket</label>
				<input id="Bucket" type="text" class="form-control" placeholder="Enter Qiniu Bucket" value="{Bucket}">
			</div>
		</div>
		<div class="col-sm-2 col-xs-12">
			<div class="form-group">
				<label>Host</label>
				<input id="Host" type="text" class="form-control" placeholder="http://host_url/" value="{Host}">
			</div>
		</div>
	</div>
</form>

<button class="btn btn-primary" id="save">Save</button>

<input id="csrf_token" type="hidden" value="{csrf}" />

<script type="text/javascript">


	$('#save').on('click', function() {

		$.post('/api/admin/plugins/qiniu/save', {_csrf : $('#csrf_token').val(), AccessKey : $('#AccessKey').val(), SecretKey:$('#SecretKey').val(), Bucket:$('#Bucket').val(), Host:$('#Host').val()}, function(data) {
			app.alertSuccess(data.message);
		});

		return false;
	});

</script>