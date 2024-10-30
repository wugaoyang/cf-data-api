DROP TABLE IF EXISTS ip_country;
CREATE TABLE IF NOT EXISTS ip_country (start_ip TEXT PRIMARY KEY,
									   end_ip TEXT ,
									   asn TEXT,
									   name TEXT,
									   domain TEXT,
									   updatedTime TEXT
                                      );


