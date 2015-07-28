
'use strict';

var winston = require('winston'),
	fs = require('fs'),
	qiniuNode = require('qiniu'),
	db = module.parent.require('./database'),
    User = module.parent.require('./user'),
    uuid = require("uuid").v4,
    path = require('path'),
	EventProxy = require('eventproxy');

(function(Qiniu) {

	var setting = {};

	db.getObjectFields('nodebb-plugin-qiniu', ['AccessKey', 'SecretKey', 'Bucket', 'Host'], function(err, values) {
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

	Qiniu.init = function(params, callback) {

		params.router.get('/admin/plugins/qiniu', params.middleware.applyCSRF, params.middleware.admin.buildHeader, renderAdmin);
		params.router.get('/api/admin/plugins/qiniu', params.middleware.applyCSRF,renderAdmin);
		params.router.get('/api/qiniu/token', getQiniuToken);
		params.router.post('/api/admin/plugins/qiniu/save', params.middleware.applyCSRF, save);

		callback();
	};

	function getQiniuToken(req, res, next) {
		var putPolicy = new qiniuNode.rs.PutPolicy(setting['Bucket']);
		res.status(200).json({uptoken:putPolicy.token()});
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
                Bucket: setting['Bucket'],
				Host: setting['Host'],
				csrf: req.csrfToken()
            };
			res.render('admin/plugins/qiniu', data);
		});
	}

	function save(req, res, next) {
		var data = req.body;
		if(data.AccessKey !== null && data.SecretKey !== undefined && data.Bucket !== undefined && data.Host != undefined) {
			var ep = new EventProxy();
			ep.all("AK", "SK", "QB", "Host", function(){
				res.status(200).json({message: 'Qiniu Config Saved!'});
			});
			ep.fail(function(err){
				return next(err);
			})
			db.setObjectField('nodebb-plugin-qiniu', 'AccessKey', data.AccessKey, ep.done("AK"));
			db.setObjectField('nodebb-plugin-qiniu', 'SecretKey', data.SecretKey, ep.done("SK"));
			db.setObjectField('nodebb-plugin-qiniu', 'Bucket', data.Bucket, ep.done("QB"));
			db.setObjectField('nodebb-plugin-qiniu', 'Host', data.Host, ep.done("Host"));
		}
	}

	Qiniu.upload = function (file, callback) {
        var putPolicy = new qiniuNode.rs.PutPolicy(setting['Bucket']);
        var token = putPolicy.token();
        var extra = new qiniuNode.io.PutExtra();
		file = file.file;
		var key = uuid() + path.extname(file.name);

        qiniuNode.io.putFile(token, key, file.path, extra, function (err, ret) {
            if(err){
                return callback(err);
            }
			fs.exists(file.path, function (exists) {
				if (exists) {
					fs.unlink(file.path, function (err) {
						if (err) {
							winston.error(err);
						}
					});
				}
			});
            callback(null, {url:setting['Host']+ret.key,
                name:file.originalFilename});
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

