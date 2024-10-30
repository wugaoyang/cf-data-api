DROP TABLE IF EXISTS ip_country;
CREATE TABLE IF NOT EXISTS ip_country (start_ip TEXT PRIMARY KEY,
									   end_ip TEXT ,
									   country TEXT ,
									   country_name TEXT,
									   continent TEXT,
									   continent_name TEXT,
									   updatedTime TEXT
                                      );


