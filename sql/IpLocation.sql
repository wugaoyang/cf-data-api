DROP TABLE IF EXISTS ip_location;
CREATE TABLE IF NOT EXISTS ip_location (ip TEXT PRIMARY KEY,
										cityNameCn TEXT ,
										cityNameEn TEXT ,
										continentCode TEXT,
										countryCode TEXT,
										countryNameEN TEXT,
										countryNameCN TEXT,
										latitude integer,
										longitude integer,
									   updatedTime TEXT
                                      );
