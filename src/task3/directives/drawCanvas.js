const app = angular.module("app");

app.directive("drawing", function(){
    let canvas,
        drawingCanvas,
        ctx,
        state,
        isStop;
    const colors = ['red', 'green', 'blue', 'purple', 'orange'];
    const squares = [];

    return {
        restrict: "AE",
        required: "ngModel",
        scope: {
            drawingBlock: '=add',
            canvasWidth: '@width',
            canvasHeight: '@height',
            stop: '=stop',
        },
        template: '<canvas id="canvas" style="border: 1px solid"></canvas>',
        link: link
    };

    function link(scope, elem, attrs) {
        canvas = elem.find('canvas')[0];
        drawingCanvas = elem.find('canvas')[1];

        canvas.width = scope.canvasWidth;
        canvas.height = scope.canvasHeight;
        ctx = canvas.getContext('2d');
        collidingSquare(5, scope.canvasWidth, scope.canvasHeight);

        /**
         * add the blocks to pressing left click mouse button
         */
        scope.$watch('drawingBlock', function(newValue) {
            if (newValue){
                squares.push(new Square({
                    radius: 50,
                    color: colors[random(colors.length - 1)],
                    position: new Vector(random(scope.canvasWidth - 10, 10), random(scope.canvasHeight - 10, 10)),
                    velocity: new Vector(1, 1),
                }));

                reDraw(canvas, squares, ctx);
            }
        }, true);

        scope.$watch('stop', function(newValue) {
            isStop = newValue;
            reDraw(canvas, squares, ctx);
        }, true);


        /**
         * event right click mouse button to delete the blocks
         */
        canvas.addEventListener('contextmenu', function(ev) {
            ev.preventDefault();
            let rect = canvas.getBoundingClientRect();
            let x = ev.clientX - rect.left;
            let y = ev.clientY - rect.top;
            let squareIndex = state.actors.findIndex(elem => (x >= elem.position.x && x <= elem.position.x + elem.radius)
                                                        && (y >= elem.position.y && y <= elem.position.y + elem.radius));
            if(squareIndex !== -1){
                squares.splice(squareIndex,1);
                reDraw(canvas, squares, ctx);
            }
            return false;
        }, false);
    }

    function sync(state) {
        clearDisplay();
        drawActors(state.actors);
    }

    function clearDisplay() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // opacity controls the trail effect set to 1 to remove
        ctx.fillStyle = 'rgba(255, 255, 255, .4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'black';
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }

    function drawActors(actors) {
        for (let actor of actors) {
            if (actor.type === 'square') {
                drawSquare(actor);
            }
        }
    }

    function drawSquare(actor) {
        ctx.beginPath();
        ctx.rect(actor.position.x, actor.position.y, actor.radius, 50);
        ctx.stroke();
        ctx.closePath();
        ctx.fillStyle = actor.color;
        ctx.fill();
    }

    function State(display, actors) {
        this.display = display;
        this.actors = actors;

        this.update = function(time) {

            /**
             * provide an update ID to let actors update other actors only once
             * used with collision detection
             */
            const updateId = Math.floor(Math.random() * 1000000);
            const actors = this.actors.map(actor => {
                return actor.update(this, time, updateId);
            });

            return new State(this.display, actors);
        }
    }

    function Vector(x,y) {
        this.x = x;
        this.y = y;

        this.add = function(vector) {
            return new Vector(this.x + vector.x, this.y + vector.y);
        }
        this.subtract = function(vector) {
            return new Vector(this.x - vector.x, this.y - vector.y);
        }

        this.multiply = function(scalar) {
            return new Vector(this.x * scalar, this.y * scalar);
        }

        this.dotProduct = function(vector) {
            return this.x * vector.x + this.y * vector.y;
        }
        this.magnitude = function() {
            return Math.sqrt(this.x ** 2 + this.y ** 2);
        }
        this.direction = function() {
            return Math.atan2(Vector.x, Vector.y);
        }
    }

    function Square(config) {
        Object.assign(this,
            {
                id: Math.floor(Math.random() * 1000000),
                type: 'square',
                position: new Vector(100, 100),
                velocity: new Vector(5, 3),
                radius: 250,
                color: 'blue',
                collisions: [],
            },
            config
        );

        this.update = function(state, time, updateId) {

            /**
             * if slice occurs on too many elements, it starts to lag
             * collisions is an array to allow multiple collisions at once
             */
            if (this.collisions.length > 10) {
                this.collisions = this.collisions.slice(this.collisions.length - 3);
            }

            /**
             * this is the most stable solution to avoid overlap
             * but it is slightly inaccurate
             */
            for (let actor of state.actors) {
                if (this === actor || this.collisions.includes(actor.id + updateId)) {
                    continue;
                }

                /**
                 * check if actors collide in the next frame and update now if they do
                 * innaccurate, but it is the easiest solution to the sticky collision bug
                 */
                const distance = this.position.add(this.velocity).subtract(actor.position.add(actor.velocity)).magnitude();
                if (distance <= this.radius ) {
                    const v1 = collisionVector(this, actor);
                    const v2 = collisionVector(actor, this);
                    this.velocity = v1;
                    actor.velocity = v2;
                    this.collisions.push(actor.id + updateId);
                    actor.collisions.push(this.id + updateId);
                }
            }

            // setting bounds on the canvas prevents squares from overlapping on update
            const upperLimit = new Vector(state.display.width - this.radius, state.display.height - this.radius);
            const lowerLimit = new Vector(0 + this.radius, 0 + this.radius);

            // check if hitting left or right of container
            if (this.position.x >= upperLimit.x || this.position.x <= lowerLimit.x) {
                this.velocity = new Vector(-this.velocity.x, this.velocity.y);
            }

            // check if hitting top or bottom of container
            if (this.position.y >= upperLimit.y || this.position.y <= lowerLimit.y) {
                this.velocity = new Vector(this.velocity.x, -this.velocity.y);
            }

            const newX = Math.max(Math.min(this.position.x + this.velocity.x, upperLimit.x), lowerLimit.x);
            const newY = Math.max(Math.min(this.position.y + this.velocity.y, upperLimit.y), lowerLimit.y);

            return new Square({
                ...this,
                position: new Vector(newX, newY),
            });
        }

        this.area = function() {
            return Math.PI * this.radius ** 2;
        }

        this.sphereArea = function() {
            return 4 * Math.PI * this.radius ** 2;
        }
    }

    function collisionVector(particle1, particle2){
        return particle1.velocity
            .subtract(particle1.position
                .subtract(particle2.position)
                .multiply(particle1.velocity
                        .subtract(particle2.velocity)
                        .dotProduct(particle1.position.subtract(particle2.position))
                    / particle1.position.subtract(particle2.position).magnitude() ** 2
                )
                // add mass to the system
                .multiply((2 * particle2.sphereArea()) / (particle1.sphereArea() + particle2.sphereArea()))
            );
    }

    function runAnimation(animation) {
        let lastTime = null;
        const frame = time => {
            if (lastTime !== null) {
                const timeStep = Math.min(100, time - lastTime) / 1000;

                // return false from animation to stop
                if (animation(timeStep) === false) {
                    return;
                }
            }

            lastTime = time;
            requestAnimationFrame(frame);
        };

        requestAnimationFrame(frame);
    };

    function random (max = 9, min = 0) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    };

    function collidingSquare(count, width, height) {
        const display = canvas;

        for (let i = 0; i < count; i++) {
            squares.push(new Square({
                radius: 50,
                color: colors[random(colors.length - 1)],
                position: new Vector(random(width - 10, 10), random(height - 10, 10)),
                velocity: new Vector(1, 1),
            }));
        }

        reDraw(display, squares, ctx);
    };

    function reDraw(display, squares){
        state = new State(display, squares);
        runAnimation(time => {
            state = state.update(time);
            sync(state);
            if(isStop) return false;
        });
    }

});