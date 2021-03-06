Template.player.onRendered(function() {

    Session.set('img_url', '/images/mysteryman.png');

    $('[data-toggle="tooltip"]').tooltip(); 

    if (this.data.lichess_username) {
        Meteor.call('getLichess', this.data.lichess_username, function(err, response) {
            Session.set('lichess_response', response);
        });
    }


});

Template.player.helpers({

    lichess_image: function() {
        var offline_img = "http://lichess1.org/assets/images/favicon-32-white.png";
        var online_img = "http://rubenwardy.github.io/lichess_widgets/lichess_online.png";

        var r = Session.get("lichess_response");

        if (r.online) {
            return online_img;
        } else {
            return offline_img;
        }
    },

    lichessBlitz: function() {
        var r = Session.get("lichess_response");

        return r.perfs.blitz.rating;
    },

    lichessBullet: function() {
        var r = Session.get("lichess_response");

        return r.perfs.bullet.rating;
    },

    loadImage: function(fide_id) {
        var img = new Image();
        img.addEventListener('load', function() { // addeventlistener is better than onload
            if (img.width !== 80) {
                Session.set('img_url', img.src);
            } else {
                Session.set('img_url', '/images/mysteryman.png');
            }
        });

        img.src = 'https://ratings.fide.com/card.php?code=' + fide_id;
    },

    lastElement: function(list) {
        return _.last(list);
    },

    isNegative: function() {
        return this.elo<this.nsf_elo;
    },

    eloDifference: function() {
        var difference = this.elo - this.nsf_elo;
        var res;

        if (difference > 0)
            res = "(+" + difference + ")"
        else if (difference < 0)
            res = "(" + difference + ")"
        else
            res = "";

        return res;
    },

    gamesDifference: function() {
        var difference = this.number_of_games - this.games[this.games.length - 1];
        var res;

        if (difference > 0)
            res = "(+" + difference + ")"
        else
            res = "";

        return res;
    },

    ratingPerGame: function() {
        var g;
        var d;
        var games_difference;

        if (this.games.length == 0)
        {
            games_difference = this.number_of_games;
        }
        else {
            games_difference = this.number_of_games - this.games[this.games.length - 1];
        }

        var elo_difference = this.elo - this.nsf_elo;

        g = this.name;

        if (games_difference==0)
            return g + " har ikke spilt noen partier siden siste offisielle rating kom.";

        if (elo_difference==0)
            return g + " har hverken gått opp eller ned siden siste offisielle rating kom.";

        var rating_per_game = parseFloat(Math.round((elo_difference/games_difference) * 100) / 100).toFixed(2);

        if (rating_per_game>0)
            d = "opp"
        else
            d = "ned"

        if (this.games.length>0)
            return " " + g + " har gått " + d + " " + Math.abs(rating_per_game) + " i rating per parti siden siste offisielle rating kom.";
        else
            return "";
    },

    better_than: function() {
        var number_of_players = Players.find().count();

        var number = Players.find({}, {
            sort: {
                elo: -1
            }
        }).map(function(player, index) {
            player.place = index + 1;
            return player;
        });

        for (var i = 0; i < number.length; i++) {
            if (number[i].nsf_id == this.nsf_id) {
                return Math.round(((number_of_players - number[i].place) / (number_of_players)) * 100);
            }
        }
    },

    getImage: function() {
        return Session.get('img_url');
    },

    merge_lists: function(first, second) {
        // Must be same length
        result = [];

        for (var i = 0; i < first.length; i++) {
            result.push([first[i], second[i]]);
        }

        return result;

    },

    ratingChart: function() {

        dates = [];

        for (var i = 0; i < this.nsf_categories.length; i++) {
            dates.push(Date.UTC(this.nsf_categories[i][0], this.nsf_categories[i][1]));
        }

        var nsf_elos_peak = [],
            majorPeakVal = 70,
            len = this.nsf_elos.length,
            i,
            prevVal = this.nsf_elos[i],
            lab = '';

        for (i = 0; i < len; i++) {
            if (this.nsf_elos[i] - prevVal > majorPeakVal) {
                lab = '+' + (this.nsf_elos[i] - prevVal);
            } else if (prevVal - this.nsf_elos[i] > majorPeakVal) {
                lab = (this.nsf_elos[i] - prevVal);
            } else {
                lab = '';
            }
            nsf_elos_peak.push({
                y: this.nsf_elos[i],
                label: lab
            });
            prevVal = this.nsf_elos[i];
        }

        nsf_date_elos = [];

        for (var i = 0; i < dates.length; i++) {
            nsf_date_elos.push([dates[i], this.nsf_elos[i]])
        }

        fide_date_elos = [];

        for (var i = 0; i < dates.length; i++) {
            fide_date_elos.push([dates[i], this.fide_elos[i]])
        }

        blitz_date_elos = [];

        for (var i = 0; i < dates.length; i++) {
            blitz_date_elos.push([dates[i], this.blitz_elos[i]])
        }

        rapid_date_elos = [];

        for (var i = 0; i < dates.length; i++) {
            rapid_date_elos.push([dates[i], this.rapid_elos[i]])
        }

        games_date = [];

        for (var i = 0; i < dates.length; i++) {
            games_date.push([dates[i], this.games[i]])
        }        

        var title_text;

        if (this.name.slice(-1) == 's')
            title_text = this.name + '\' ratingprogresjon';
        else
            title_text = this.name + 's ratingprogresjon';

        return {
            chart: {
                zoomType: 'x'
            },
            title: {
                text: title_text,
                align: 'center',
                x: -20,
            },
            xAxis: {
                type: 'datetime',
            },
            yAxis: {
                title: {
                    text: 'Elo'
                },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            },
            tooltip: {
                shared: true,
            },
            legend: {
                align: 'top',
                verticalAlign: 'top',
                layout: 'horizontal',
                y: 10,
            },
            plotOptions: {
                series: {
                    dataLabels: {
                        enabled: false
                    }
                }
            },
            series: [{
                name: 'Norsk elo (Offisiell)',
                data: nsf_date_elos
            }, {
                name: 'FIDE elo',
                data: fide_date_elos
            }, {
                name: 'Lyn',
                data: blitz_date_elos
            }, {
                name: 'Hurtig',
                data: rapid_date_elos
            }, {
                name: 'Antall partier',
                data: games_date
            }],
            credits: false,
        };
    }
});
