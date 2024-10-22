DROP TABLE IF EXISTS cf_ip_info;
CREATE TABLE IF NOT EXISTS cf_ip_info (ip TEXT PRIMARY KEY,
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
