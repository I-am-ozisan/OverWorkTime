create table t_worktime (
  user_id varchar(10) not null
  , calendar_date date not null
  , estimate_start_time varchar(5) not null
  , estimate_end_time varchar(5) not null
  , rest_time varchar(5) not null
  , expreience_end_time varchar(5) not null
  , over_time varchar(5) not null
  , version Integer not null
  , logical_delete_flg varchar(1) not null
  , primary key (user_id, calendar_date)
);

create table M_CALENDAR (
   calendar_date date not null
  , week_of_date varchar(3) not null
  , holiday_flg varchar(1) not null
  , primary key (calendar_date)
);


