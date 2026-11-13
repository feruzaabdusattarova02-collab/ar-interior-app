
if (!AFRAME.components['ar-hit-test']) {
    AFRAME.registerComponent('ar-hit-test', {
    init: function () {
        this.reticle = document.querySelector('#reticle');
        this.objects = document.querySelector('#objects');
        this.hitTestSource = null;
        this.referenceSpace = null;
        this.currentPose = null;
        this.selectedModel = 'chair';
        this.placedObjects = [];
        this.session = null;

        this.el.addEventListener('enter-vr', () => {
            const session = this.el.renderer.xr.getSession();

            if (session && session !== this.session) {
                this.session = session;
                this.startHitTest(session);
            }
        });

        this.el.addEventListener('exit-vr', () => {
            this.stopHitTest();
        });
    },

    startHitTest: async function (session) {
        try {
            const viewerSpace =
                await session.requestReferenceSpace('viewer');

            this.referenceSpace =
                await session.requestReferenceSpace('local');

            this.hitTestSource =
                await session.requestHitTestSource({
                    space: viewerSpace
                });

            session.addEventListener('select', () => {
                this.placeObject();
            });

        } catch (error) {
            console.error('Hit-test xatosi:', error);
        }
    },

    tick: function () {
        if (!this.hitTestSource || !this.referenceSpace) {
            return;
        }

        const frame = this.el.renderer.xr.getFrame();

        if (!frame) return;

        const results =
            frame.getHitTestResults(this.hitTestSource);

        if (results.length > 0) {
            const pose = results[0].getPose(
                this.referenceSpace
            );

            this.currentPose = pose;

            this.reticle.object3D.position.set(
                pose.transform.position.x,
                pose.transform.position.y,
                pose.transform.position.z
            );

            this.reticle.setAttribute('visible', true);
        } else {
            this.currentPose = null;
            this.reticle.setAttribute('visible', false);
        }
    },

    placeObject: function () {
        if (!this.currentPose) return;

        const furniture = document.createElement('a-entity');

        const models = {
            chair: '#chairModel'
        };

        furniture.setAttribute(
            'gltf-model',
            models[this.selectedModel] || '#chairModel'
        );

        furniture.object3D.position.set(
            this.currentPose.transform.position.x,
            this.currentPose.transform.position.y,
            this.currentPose.transform.position.z
        );

        furniture.setAttribute('scale', '0.5 0.5 0.5');

        this.objects.appendChild(furniture);
        this.placedObjects.push(furniture);
    },

    stopHitTest: function () {
        if (this.hitTestSource) {
            this.hitTestSource.cancel();
        }

        this.hitTestSource = null;
        this.referenceSpace = null;
        this.currentPose = null;
        this.session = null;

        this.reticle.setAttribute('visible', false);
    }
});
}
