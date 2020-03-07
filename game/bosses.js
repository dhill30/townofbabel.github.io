function SlowDogg(game, dogs) {
    // animations
    this.anim = {};
    this.anim.idle = new Animation(ASSET_MANAGER.getAsset('./img/entities/slow_dogg.png'), 0, 0, 200, 200, 1, 1, true, false);
    this.anim.move = new Animation(ASSET_MANAGER.getAsset('./img/entities/slow_dogg.png'), 200, 0, 200, 200, 0.2, 3, true, false);
    this.anim.atk = new Animation(ASSET_MANAGER.getAsset('./img/entities/slow_dogg.png'), 0, 600, 400, 300, 0.125, 4, false, false);
    this.anim.sht = new Animation(ASSET_MANAGER.getAsset('./img/entities/slow_dogg.png'), 0, 200, 200, 200, 0.1, 8, false, false);
    this.anim.wsl = new Animation(ASSET_MANAGER.getAsset('./img/entities/slow_dogg.png'), 0, 400, 200, 200, 0.1, 3, false, false);
    this.anim.hit = new Animation(ASSET_MANAGER.getAsset('./img/entities/slow_dogg.png'), 1400, 0, 200, 200, 0.15, 1, false, false);
    this.anim.die = new Animation(ASSET_MANAGER.getAsset('./img/entities/slow_dogg.png'), 800, 0, 200, 200, 0.25, 2, false, false);

    // properties
    this.alive = true;
    this.boss = true;
    this.enemy = true;
    this.dogs = dogs;
    this.radius = 38;
    this.faces = 42;
    this.sides = 42;
    this.rotation = Math.PI / 2;
    this.acceleration = 50;
    this.velocity = { x: 0, y: 0 };
    this.maxSpeed = 65;
    this.mSpeed_init = 65;
    this.range = 130;
    this.health = 250;
    this.hpDrop = Math.floor(Math.random() * 2) + 3;

    this.engage = true;
    this.atkCD = 0;
    this.stunCD = 0;
    this.knockBack = 0;
    this.shtCD = 0;
    this.wslCD = 0;
    this.hitCD = 0;

    Entity.call(this, game, 150, 150);
}

SlowDogg.prototype = new Entity();
SlowDogg.prototype.constructor = SlowDogg;

SlowDogg.prototype.update = function () {
    if (Number.isNaN(this.health)) {
        this.health = 250;
    }

    if (this.health <= 0) {
        this.die = true;
        this.alive = false;
    }
    if (this.die && this.anim.die.isDone()) {
        this.anim.die.elapsedTime = 0;
        this.die = false;
    }
    if (this.alive && !this.die) {
        if (this.atkCD > 0) this.atkCD--;
        if (this.stunCD > 0) this.stunCD--;
        if (this.knockBack > 0) this.knockBack--;
        if (this.shtCD > 0) this.shtCD--;
        if (this.wslCD > 0) this.wslCD--;
        if (this.hitCD > 0) this.hitCD--;

        // animation control
        if (this.hurt && this.anim.hit.isDone()) {
            this.anim.hit.elapsedTime = 0;
            this.hurt = false;
        }
        if (this.whistle || this.shoot) {
            this.velocity.x *= (2 / 7);
            this.velocity.y *= (2 / 7);
            if (this.anim.wsl.isDone()) {
                this.anim.wsl.elapsedTime = 0;
                this.whistle = false;
                this.wslCD = 720;
            }
            if (this.anim.sht.isDone()) {
                this.anim.sht.elapsedTime = 0;
                this.shoot = false;
                this.shtCD = 90;
            }
        }
        if (this.attack) {
            if (this.anim.atk.isDone() || this.stunCD > 0) {
                this.anim.atk.elapsedTime = 0;
                this.attack = false;
                this.atkCD = 60;
            }
        }

        // boundary collisions
        if (this.collideLeft() || this.collideRight()) {
            this.velocity.x = -this.velocity.x * (1 / friction);
            if (this.collideLeft()) this.x = this.radius;
            if (this.collideRight()) this.x = 1280 - this.radius;
        }
        if (this.collideTop() || this.collideBottom()) {
            this.velocity.y = -this.velocity.y * (1 / friction);
            if (this.collideTop()) this.y = this.radius;
            if (this.collideBottom()) this.y = 720 - this.radius;
        }

        // entity collisions
        for (var i = 0; i < this.game.entities.length; i++) {
            var ent = this.game.entities[i];
            if (ent.player && ent.alive && this.stunCD <= 0) {
                var atan = Math.atan2(ent.y - this.y, ent.x - this.x);
                if (this.rotation > atan) {
                    var rotdif = this.rotation - atan;
                    if (rotdif > Math.PI) {
                        rotdif = Math.PI * 2 - rotdif;
                        this.rotation += rotdif / 20;
                    }
                    else this.rotation -= rotdif / 20;
                }
                else {
                    var rotdif = atan - this.rotation;
                    if (rotdif > Math.PI) {
                        rotdif = Math.PI * 2 - rotdif;
                        this.rotation -= rotdif / 20;
                    }
                    else this.rotation += rotdif / 20;
                }
                var difX = Math.cos(atan);
                var difY = Math.sin(atan);
                var delta = this.radius + ent.radius - distance(this, ent);
                if (this.collide(ent) && !ent.dash && !ent.supDash && !ent.lunge) {
                    this.velocity.x = -this.velocity.x * (1 / friction);
                    this.velocity.y = -this.velocity.y * (1 / friction);
                    this.x -= difX * delta / 2;
                    this.y -= difY * delta / 2;
                    ent.x += difX * delta / 2;
                    ent.y += difY * delta / 2;
                }
                else {
                    if (this.knockBack <= 0) {
                        this.velocity.x += Math.cos(this.rotation) * this.acceleration;
                        this.velocity.y += Math.sin(this.rotation) * this.acceleration;
                        this.maxSpeed = this.mSpeed_init;
                    }
                    else {
                        this.velocity.x -= difX * this.acceleration * 6;
                        this.velocity.y -= difY * this.acceleration * 6;
                        this.maxSpeed *= 1.4;
                    }
                }
                var dist = distance(this, ent);
                if (this.wslCD <= 0 && this.dogs.length > 0) {
                    this.whistle = true;
                    var dog = this.dogs.pop();
                    dog.caged = false;
                    this.wslCD = 720;
                }
                else if (dist < 140 && this.atkCD <= 0) {
                    this.attack = true;
                    this.atkCD = 112;
                }
                else if (this.shtCD <= 0) {
                    this.shoot = true;
                    this.shtCD = 118;
                }
                if (this.attack && ent.hitCD <= 0 && this.hit(ent)) {
                    ent.hurt = true;
                    ent.health.current -= 2;
                    ent.hitCD = 20;
                }
                else if (this.shoot && this.shtCD == 100) {
                    var gunRot = this.rotation + Math.atan(29 / 86);
                    var difX = Math.cos(gunRot) * 90;
                    var difY = Math.sin(gunRot) * 90;
                    this.game.addEntity(new Bullet(this.game, this.x + difX, this.y + difY, this.rotation + Math.PI / 7, 1));
                    this.game.addEntity(new Bullet(this.game, this.x + difX, this.y + difY, this.rotation + Math.PI / 21, 1));
                    this.game.addEntity(new Bullet(this.game, this.x + difX, this.y + difY, this.rotation - Math.PI / 21, 1));
                    this.game.addEntity(new Bullet(this.game, this.x + difX, this.y + difY, this.rotation - Math.PI / 7, 1));
                }
            }
        }
    }
    // speed control
    var speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (speed > this.maxSpeed) {
        var ratio = this.maxSpeed / speed;
        this.velocity.x *= ratio;
        this.velocity.y *= ratio;
    }
    this.x += this.velocity.x * this.game.clockTick;
    this.y += this.velocity.y * this.game.clockTick;

    this.velocity.x -= friction * this.game.clockTick * this.velocity.x;
    this.velocity.y -= friction * this.game.clockTick * this.velocity.y;
}

SlowDogg.prototype.draw = function (ctx) {
    if (this.die)
        this.anim.die.drawFrame(this.game.clockTick, ctx, this.x, this.y, this.rotation + Math.PI / 2);
    else if (this.hurt)
        this.anim.hit.drawFrame(this.game.clockTick, ctx, this.x, this.y, this.rotation + Math.PI / 2);
    else if (this.whistle)
        this.anim.wsl.drawFrame(this.game.clockTick, ctx, this.x, this.y, this.rotation + Math.PI / 2);
    else if (this.attack)
        this.anim.atk.drawFrame(this.game.clockTick, ctx, this.x, this.y, this.rotation + Math.PI / 2);
    else if (this.shoot)
        this.anim.sht.drawFrame(this.game.clockTick, ctx, this.x, this.y, this.rotation + Math.PI / 2);
    else {
        if (this.velocity.x > -5 && this.velocity.x < 5 && this.velocity.y > -5 && this.velocity.y < 5)
            this.anim.idle.drawFrame(this.game.clockTick, ctx, this.x, this.y, this.rotation + Math.PI / 2);
        else
            this.anim.move.drawFrame(this.game.clockTick, ctx, this.x, this.y, this.rotation + Math.PI / 2);
    }
}

SlowDogg.prototype.hit = function (other) {
    var acc = 1;
    var atan2 = Math.atan2(other.y - this.y, other.x - this.x);
    var orien = Math.abs(this.rotation - other.rotation);
    if (orien > Math.PI) orien = (Math.PI * 2) - orien;

    if (this.anim.atk.currentFrame() != 0) {
        var moveAmnt = (Math.atan(158 / 10) + Math.atan(86 / 46)) / (this.anim.atk.totalTime - this.anim.atk.frameDuration);
        var caneAngle = (this.rotation + Math.atan(158 / 10)) - ((this.anim.atk.elapsedTime - this.anim.atk.frameDuration) * moveAmnt);
        acc = Math.abs(caneAngle - atan2);
        if (acc > Math.PI) acc = (Math.PI * 2) - acc;
    }

    if (acc < 0.25) {
        if (orien < Math.PI / 4 || orien > Math.PI * 3 / 4)
            return distance(this, other) < this.range + other.faces;
        else
            return distance(this, other) < this.range + other.sides;
    }
    else
        return false;
}
