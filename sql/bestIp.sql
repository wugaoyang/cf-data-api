DROP TABLE IF EXISTS cf_best_ip;
CREATE TABLE IF NOT EXISTS cf_best_ip (ip TEXT PRIMARY KEY,
									   name TEXT,
									   area TEXT ,
									   `group` TEXT,
									   delay integer,
									   speed integer,
									   updatedTime TEXT,
									   status integer
                                      );
