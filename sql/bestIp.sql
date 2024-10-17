DROP TABLE IF EXISTS cf_best_ip;
CREATE TABLE IF NOT EXISTS cf_best_ip (ip TEXT PRIMARY KEY,
									   cityNameCN TEXT ,
									   cityNameEN TEXT ,
									   continentCode TEXT,
									   countryCode TEXT,
									   countryNameEN TEXT,
									   countryNameCN TEXT,
									   latitude integer,
									   longitude integer,
									   name TEXT,
									   `group` TEXT,
									   delay integer,
									   speed integer,
									   `source` integer,
									   status integer,
									   updatedTime TEXT
                                      );
