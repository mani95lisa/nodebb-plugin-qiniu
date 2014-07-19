
'use strict';

var request = require('request'),
	winston = require('winston'),
	fs = require('fs'),
	qiniuNode = require('qiniu'),
	db = module.parent.require('./database'),
	EventProxy = require('eventproxy');

(function(Qiniu) {

	var setting = {},
		fields = [
			'nodebb-plugin-qiniu:AccessKey',
			'nodebb-plugin-qiniu:SecretKey',
			'nodebb-plugin-qiniu:Bucket'
		],
		newFieldName;

	db.getObjectFields('nodebb-plugin-qiniu', ['AccessKey', 'SecretKey', 'Bucket'], function(err, values) {
		if(err) {
			return winston.error(err.message);
		}

		for (var field in values){
			if (values.hasOwnProperty(field)){
				setting[field] = values[field];
			}
		}
        qiniuNode.conf.ACCESS_KEY = setting['AccessKey'];
        qiniuNode.conf.SECRET_KEY = setting['SecretKey'];
	});

	Qiniu.init = function(app, middleware, controllers) {

		app.get('/admin/plugins/qiniu', middleware.admin.buildHeader, renderAdmin);
		app.get('/api/admin/plugins/qiniu', renderAdmin);
		app.get('/api/qiniu/token', getQiniuToken)
		app.post('/api/admin/plugins/qiniu/save', save);
	};

	function getQiniuToken(req, res, next) {
		var putPolicy = new qiniuNode.rs.PutPolicy(setting['Bucket']);
		res.json(200, {uptoken:putPolicy.token()});
	}

	function renderAdmin(req, res, next) {
		db.getObjectFields('nodebb-plugin-qiniu', ['AccessKey', 'SecretKey', 'Bucket'], function(err, values) {
			if(err) {
				return winston.error(err.message);
			}

			for (var field in values){
				if (values.hasOwnProperty(field)){
                    setting[field] = values[field];
				}
			}
            var data = {
                AccessKey: setting['AccessKey'],
                SecretKey: setting['SecretKey'],
                Bucket: setting['Bucket']
            };
			res.render('admin/plugins/qiniu', data);
		});		
	}

	function save(req, res, next) {
		var data = req.body;
		if(data.AccessKey !== null && data.SecretKey !== undefined && data.Bucket !== undefined) {
			var ep = new EventProxy();
			ep.all("AK", "SK", "QB", function(AK, SK, QB){
				res.json(200, {message: 'Qiniu Config Completed!'});
			});
			ep.fail(function(err){
				return next(err);
			})
			db.setObjectField('nodebb-plugin-qiniu', 'AccessKey', data.AccessKey, ep.done("AK"));
			db.setObjectField('nodebb-plugin-qiniu', 'SecretKey', data.SecretKey, ep.done("SK"));
			db.setObjectField('nodebb-plugin-qiniu', 'Bucket', data.Bucket, ep.done("QB"));
		}
	}

	Qiniu.upload = function (file, callback) {
        var putPolicy = new qiniuNode.rs.PutPolicy(setting['Bucket']);
        var token = putPolicy.token();
        var extra = new qiniuNode.io.PutExtra();
        qiniuNode.io.putFile(token, '', file.path, extra, function (err, ret) {
            if(err){
                return callback(err);
            }
            callback(null, {url:'http://'+setting['Bucket']+'.qiniudn.com/'+ret.key,name:file.originalFilename?file.originalFilename:file.name});
        });
	};

	var admin = {};

	admin.menu = function(menu, callback) {
		menu.plugins.push({
			route: '/plugins/qiniu',
			icon: 'fa-cloud',
			name: 'Qiniu'
		});

		callback(null, menu);
	};

	Qiniu.admin = admin;

}(module.exports));

