create table big_data_final_project.locations
(
	id int auto_increment
		primary key,
	name varchar(255) null,
	latitude double null,
	longitude double null,
	constraint locations_id_uindex
		unique (id)
)
;

create table big_data_final_project.users
(
	id int auto_increment
		primary key,
	username varchar(255) null,
	password varchar(255) null,
	family int null,
	constraint users_id_uindex
		unique (id)
)
;

